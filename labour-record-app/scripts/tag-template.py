#!/usr/bin/env python3
"""Inject docxtemplater tags into a supplied statutory Word template.

Tags the FIRST data row of the main table as a {#rows}…{/rows} loop and removes
the remaining placeholder rows. Also performs literal header text replacements.

Usage:
  tag-template.py <docx> --period-find "TEXT" \
      --fields '{#rows}{sno}' '{name}' ... '{last}{/rows}' \
      [--replace FIND REPLACE]...

Operates in place on the .docx (a zip).
"""
import sys, re, zipfile, shutil, argparse, os, tempfile

def top_level_spans(s, name):
    """Return (start,end) spans of top-level <name ...>...</name> elements,
    correctly skipping nested elements of the same name."""
    open_re = re.compile(r'<' + name + r'(?:\s[^>]*)?>')
    close_tag = '</' + name + '>'
    spans = []
    depth = 0
    start = None
    i = 0
    while i < len(s):
        om = open_re.match(s, i)
        if om:
            if depth == 0:
                start = i
            depth += 1
            i = om.end()
            continue
        if s.startswith(close_tag, i):
            depth -= 1
            i += len(close_tag)
            if depth == 0:
                spans.append((start, i))
            continue
        i += 1
    return spans

def top_level_blocks(s, name):
    return [s[a:b] for (a, b) in top_level_spans(s, name)]

def tag_cell(cell_xml, tag_text):
    """Replace the text of a cell's first paragraph with a single run = tag_text."""
    # Find first paragraph
    pm = re.search(r'<w:p\b.*?</w:p>', cell_xml, re.S)
    if not pm:
        return cell_xml
    para = pm.group(0)
    # Keep paragraph properties (pPr) if present
    ppr = re.search(r'<w:pPr>.*?</w:pPr>', para, re.S)
    ppr_xml = ppr.group(0) if ppr else ''
    run = (f'<w:r><w:rPr><w:sz w:val="16"/><w:szCs w:val="16"/></w:rPr>'
           f'<w:t xml:space="preserve">{tag_text}</w:t></w:r>')
    new_para = f'<w:p>{ppr_xml}{run}</w:p>'
    return cell_xml[:pm.start()] + new_para + cell_xml[pm.end():]

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('docx')
    ap.add_argument('--period-find', default=None)
    ap.add_argument('--fields', nargs='+', required=True)
    ap.add_argument('--replace', nargs=2, action='append', default=[])
    ap.add_argument('--table-index', type=int, default=0,
                    help='Which <w:tbl> to tag (0-based). Default 0.')
    ap.add_argument('--daily-array', default=None,
                    help='If set, cells after the --fields info cells collapse into ONE '
                         'cell looping this array; remaining day cells are deleted.')
    args = ap.parse_args()

    tmp = tempfile.mkdtemp()
    with zipfile.ZipFile(args.docx) as z:
        z.extractall(tmp)
    doc_path = os.path.join(tmp, 'word', 'document.xml')
    x = open(doc_path, encoding='utf-8').read()

    # Header literal replacements
    if args.period_find:
        x = x.replace(args.period_find, '{period}')
    for find, repl in args.replace:
        x = x.replace(find, repl)

    def strip_wrapper(s, name):
        """Return inner content of the first <name ...>…</name> wrapper + its offset."""
        m = re.match(r'<' + name + r'(?:\s[^>]*)?>', s)
        close = '</' + name + '>'
        if not m or not s.endswith(close):
            return s, 0
        return s[m.end():len(s) - len(close)], m.end()

    def mask_nested(s, name):
        """Replace top-level <name>…</name> blocks in s with equal-length spaces."""
        out = list(s)
        for (a, b) in top_level_spans(s, name):
            for i in range(a, b):
                out[i] = ' '
        return ''.join(out)

    def top_level_rows(tbl_xml):
        """Top-level <w:tr> blocks of a table, excluding nested-table rows."""
        inner, off = strip_wrapper(tbl_xml, 'w:tbl')
        masked = mask_nested(inner, 'w:tbl')  # blank out nested tables
        return [inner[a:b] for (a, b) in top_level_spans(masked, 'w:tr')]

    def top_level_cells(row_xml):
        inner, off = strip_wrapper(row_xml, 'w:tr')
        masked = mask_nested(inner, 'w:tbl')
        return [inner[a:b] for (a, b) in top_level_spans(masked, 'w:tc')]

    # Locate the requested top-level table
    tbl_spans = top_level_spans(x, 'w:tbl')
    if args.table_index >= len(tbl_spans):
        print(f'ERROR: table index {args.table_index} but only {len(tbl_spans)} tables', file=sys.stderr); sys.exit(1)
    t_start, t_end = tbl_spans[args.table_index]
    class _M:
        def start(self): return t_start
        def end(self): return t_end
    tbl_m = _M()
    tbl = x[t_start:t_end]
    rows = top_level_rows(tbl)

    def first_cell_text(r):
        cells = top_level_cells(r)
        return re.sub(r'<[^>]+>', '', cells[0]).strip() if cells else ''

    data_idx = [i for i, r in enumerate(rows) if re.fullmatch(r'\d+', first_cell_text(r))]
    if not data_idx:
        print('ERROR: no numbered data rows found', file=sys.stderr); sys.exit(1)

    template_i = data_idx[0]
    template_row = rows[template_i]
    cells = top_level_cells(template_row)

    if args.daily_array:
        # Info cells = args.fields; remaining cells collapse into ONE looping day cell.
        n_info = len(args.fields)
        if len(cells) <= n_info:
            print(f'ERROR: daily mode needs > {n_info} cells, found {len(cells)}', file=sys.stderr); sys.exit(1)
        new_cells = [tag_cell(c, f) for c, f in zip(cells[:n_info], args.fields)]
        day_cell = tag_cell(cells[n_info], '{#%s}{.}{/%s}{/rows}' % (args.daily_array, args.daily_array))
        new_cells.append(day_cell)
        # cells[n_info+1:] are dropped (the rest of the fixed day columns)
        print(f'  daily mode: {n_info} info cells + 1 looped day cell (dropped {len(cells)-n_info-1} fixed day cells)')
    else:
        if len(cells) != len(args.fields):
            print(f'ERROR: {len(cells)} cells but {len(args.fields)} fields', file=sys.stderr); sys.exit(1)
        new_cells = [tag_cell(c, f) for c, f in zip(cells, args.fields)]
    # Rebuild the row preserving the <w:tr ...> opening and trPr
    tr_open = re.match(r'<w:tr\b[^>]*>', template_row).group(0)
    trpr = re.search(r'<w:trPr>.*?</w:trPr>', template_row, re.S)
    trpr_xml = trpr.group(0) if trpr else ''
    new_row = tr_open + trpr_xml + ''.join(new_cells) + '</w:tr>'

    # Replace template row, delete other data rows
    keep = set(range(len(rows))) - (set(data_idx) - {template_i})
    rebuilt = []
    for i, r in enumerate(rows):
        if i == template_i:
            rebuilt.append(new_row)
        elif i in keep:
            rebuilt.append(r)
    new_tbl = re.sub(r'(<w:tbl>).*(</w:tbl>)',
                     lambda m: m.group(1) + tbl[tbl.find('>')+1:tbl.rfind('<w:tr')] + ''.join(rebuilt) + m.group(2),
                     tbl, flags=re.S) if False else None
    # Simpler: rebuild table by replacing the concatenation of all <w:tr> with rebuilt rows
    all_rows_concat = ''.join(rows)
    new_tbl = tbl.replace(all_rows_concat, ''.join(rebuilt))
    x = x[:tbl_m.start()] + new_tbl + x[tbl_m.end():]

    open(doc_path, 'w', encoding='utf-8').write(x)

    # Re-zip
    tmp_zip = args.docx + '.tmp'
    with zipfile.ZipFile(tmp_zip, 'w', zipfile.ZIP_DEFLATED) as z:
        for root, _, files in os.walk(tmp):
            for f in files:
                full = os.path.join(root, f)
                arc = os.path.relpath(full, tmp)
                z.write(full, arc)
    shutil.move(tmp_zip, args.docx)
    shutil.rmtree(tmp)
    print(f'OK: tagged {args.docx} ({len(args.fields)} cols, kept 1 loop row)')

if __name__ == '__main__':
    main()
