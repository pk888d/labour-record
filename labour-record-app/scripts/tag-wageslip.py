#!/usr/bin/env python3
"""Tag a vertical per-employee wage-slip template (Form XVII / Form T).

Tags specific (row, cell) value cells with {field} placeholders and wraps the
whole table in a {#rows}…{/rows} loop with a page break, so one slip prints per
employee. Operates in place.
"""
import sys, re, zipfile, shutil, os, tempfile

# (row_index, cell_index) -> field tag for the value cells.
CELL_FIELDS = {
    (0, 1): '{establishmentName}',
    (1, 1): '{name}',
    (2, 1): '{fatherSpouseName}',
    (3, 1): '{designation}',
    (4, 1): '{dateOfEntry}',
    (5, 1): '{period}',
    (7, 1): '{basic}',   (7, 3): '{pf}',
    (8, 1): '{da}',      (8, 3): '{esi}',
    (9, 1): '{hra}',     (9, 3): '{otherDeductions}',
    (10, 1): '{overtimeWages}',
    (11, 1): '{leaveWages}',
    (12, 1): '{otherAllowances}',
    (13, 1): '{grossEarnings}', (13, 3): '{netWage}',
}

def top_level_spans(s, name):
    open_re = re.compile(r'<' + name + r'(?:\s[^>]*)?>')
    close_tag = '</' + name + '>'
    spans, depth, start, i = [], 0, None, 0
    while i < len(s):
        m = open_re.match(s, i)
        if m:
            if depth == 0: start = i
            depth += 1; i = m.end(); continue
        if s.startswith(close_tag, i):
            depth -= 1; i += len(close_tag)
            if depth == 0: spans.append((start, i))
            continue
        i += 1
    return spans

def strip_wrap(s, name):
    m = re.match(r'<' + name + r'(?:\s[^>]*)?>', s); c = '</' + name + '>'
    return (s[m.end():len(s) - len(c)], m.end()) if m and s.endswith(c) else (s, 0)

def mask(s, name):
    out = list(s)
    for (a, b) in top_level_spans(s, name):
        for i in range(a, b): out[i] = ' '
    return ''.join(out)

def tag_cell(cell_xml, tag_text):
    pm = re.search(r'<w:p\b.*?</w:p>', cell_xml, re.S)
    if not pm: return cell_xml
    para = pm.group(0)
    ppr = re.search(r'<w:pPr>.*?</w:pPr>', para, re.S)
    ppr_xml = ppr.group(0) if ppr else ''
    run = (f'<w:r><w:rPr><w:sz w:val="18"/><w:szCs w:val="18"/></w:rPr>'
           f'<w:t xml:space="preserve">{tag_text}</w:t></w:r>')
    return cell_xml[:pm.start()] + f'<w:p>{ppr_xml}{run}</w:p>' + cell_xml[pm.end():]

def main():
    path = sys.argv[1]
    tmp = tempfile.mkdtemp()
    with zipfile.ZipFile(path) as z: z.extractall(tmp)
    doc_path = os.path.join(tmp, 'word', 'document.xml')
    x = open(doc_path, encoding='utf-8').read()

    t_spans = top_level_spans(x, 'w:tbl')
    t_start, t_end = t_spans[0]
    tbl = x[t_start:t_end]

    inner, _ = strip_wrap(tbl, 'w:tbl')
    row_spans = top_level_spans(mask(inner, 'w:tbl'), 'w:tr')
    rows = [inner[a:b] for (a, b) in row_spans]

    new_rows = []
    for ri, row in enumerate(rows):
        cinner, _ = strip_wrap(row, 'w:tr')
        cell_spans = top_level_spans(mask(cinner, 'w:tbl'), 'w:tc')
        cells = [cinner[a:b] for (a, b) in cell_spans]
        new_cells = []
        for ci, cell in enumerate(cells):
            field = CELL_FIELDS.get((ri, ci))
            new_cells.append(tag_cell(cell, field) if field else cell)
        tr_open = re.match(r'<w:tr\b[^>]*>', row).group(0)
        trpr = re.search(r'<w:trPr>.*?</w:trPr>', row, re.S)
        new_rows.append(tr_open + (trpr.group(0) if trpr else '') + ''.join(new_cells) + '</w:tr>')

    new_tbl = tbl.replace(''.join(rows), ''.join(new_rows))

    # Wrap the table in a per-employee loop with a trailing page break.
    loop_open = '<w:p><w:r><w:t xml:space="preserve">{#rows}</w:t></w:r></w:p>'
    loop_close = ('<w:p><w:r><w:t xml:space="preserve">{/rows}</w:t></w:r>'
                  '<w:r><w:br w:type="page"/></w:r></w:p>')
    x = x[:t_start] + loop_open + new_tbl + loop_close + x[t_end:]

    open(doc_path, 'w', encoding='utf-8').write(x)
    tmp_zip = path + '.tmp'
    with zipfile.ZipFile(tmp_zip, 'w', zipfile.ZIP_DEFLATED) as z:
        for root, _, files in os.walk(tmp):
            for f in files:
                full = os.path.join(root, f)
                z.write(full, os.path.relpath(full, tmp))
    shutil.move(tmp_zip, path)
    shutil.rmtree(tmp)
    print(f'OK: tagged wage slip {path}')

if __name__ == '__main__':
    main()
