import { NextResponse } from 'next/server'
import * as XLSX from 'xlsx'

const M    = 'Mandatory'
const O    = 'Optional'
const AUTO = 'Optional (auto-generated)'
const X    = '— Not used'

// [header, ADD, UPDATE, DELETE, notes]
type ColDef = [string, string, string, string, string]

const COLS: ColDef[] = [
  // ── Core ──────────────────────────────────────────────────────────────────
  ['Action',               M,    M,    M,    'ADD / UPDATE / DELETE'],
  ['Emp ID',               AUTO, M,    M,    'Your employee code e.g. EMP-0001'],
  ['Name',                 M,    O,    X,    'Full legal name'],
  ['Salary',               M,    O,    X,    'Monthly gross total (₹)'],
  // ── Personal ──────────────────────────────────────────────────────────────
  ['Sex',                  O,    O,    X,    'M or F'],
  ['Father/Spouse',        O,    O,    X,    "Father's name (unmarried) or spouse name"],
  ['DOB',                  O,    O,    X,    'Date of Birth  YYYY-MM-DD  (must be 14+ years ago)'],
  // ── Work ──────────────────────────────────────────────────────────────────
  ['Date of Entry',        O,    O,    X,    'First day of employment  YYYY-MM-DD'],
  ['Designation',          O,    O,    X,    'Job title e.g. Nurse, Pharmacist, Lab Tech'],
  ['Department',           O,    O,    X,    'Section / unit e.g. OPD, ICU, Pharmacy'],
  // ── Contact ───────────────────────────────────────────────────────────────
  ['Phone',                O,    O,    X,    '10-digit mobile number'],
  ['Email',                O,    O,    X,    'Official contact email'],
  // ── Address ───────────────────────────────────────────────────────────────
  ['Present Address',      O,    O,    X,    'Current residential address'],
  ['Permanent Address',    O,    O,    X,    'Permanent / native address'],
  // ── Payment ───────────────────────────────────────────────────────────────
  ['Payment Mode',         O,    O,    X,    'BANK or CASH  (default: BANK)'],
  ['Bank A/C',             O,    O,    X,    'Account number (leave blank for CASH)'],
  ['IFSC',                 O,    O,    X,    'e.g. SBIN0001234  (leave blank for CASH)'],
  ['Bank Name',            O,    O,    X,    'e.g. State Bank of India'],
  // ── Statutory IDs ─────────────────────────────────────────────────────────
  ['UAN',                  O,    O,    X,    '12-digit EPFO Universal Account Number'],
  ['ESI No',               O,    O,    X,    'ESI insurance number'],
  ['Aadhaar',              O,    O,    X,    '12-digit Aadhaar (sensitive — handle securely)'],
  // ── Salary breakdown ──────────────────────────────────────────────────────
  ['Basic Wage',           O,    O,    X,    'Monthly basic wage (₹)'],
  ['DA',                   O,    O,    X,    'Dearness Allowance per month (₹)'],
  ['HRA',                  O,    O,    X,    'House Rent Allowance per month (₹)'],
  // ── PF ────────────────────────────────────────────────────────────────────
  ['PF Mode',              O,    O,    X,    'PERCENT / FIXED / NONE  (default: PERCENT)'],
  ['PF %',                 O,    O,    X,    'PF percentage  (default: 12)'],
  ['PF Wage Ceiling',      O,    O,    X,    'PF wage ceiling (₹)  (default: 15000)'],
  ['PF Amount',            O,    O,    X,    'Monthly PF deduction (₹)'],
  // ── ESI / LWF ─────────────────────────────────────────────────────────────
  ['ESI Amount',           O,    O,    X,    'Monthly ESI deduction (₹)'],
  ['LWF Amount',           O,    O,    X,    'Labour Welfare Fund deduction (₹)'],
  // ── Service dates ─────────────────────────────────────────────────────────
  ['480 Days Completion',  O,    O,    X,    'Date of 480-day milestone  YYYY-MM-DD'],
  ['Date Made Permanent',  O,    O,    X,    'Confirmation / regularisation date  YYYY-MM-DD'],
  ['Period of Suspension', O,    O,    X,    'Any suspension period e.g. 15 days — April 2024'],
  // ── Other ─────────────────────────────────────────────────────────────────
  ['Remarks',              O,    O,    X,    'Any additional notes'],
]

export async function GET() {
  const headers   = COLS.map(([h])      => h)
  const addReq    = ['ADD →',    ...COLS.slice(1).map(([, a])    => a)]
  const updateReq = ['UPDATE →', ...COLS.slice(1).map(([,, u])   => u)]
  const deleteReq = ['DELETE →', ...COLS.slice(1).map(([,,, d])  => d)]
  const notesRow  = ['Notes',    ...COLS.slice(1).map(([,,,, n]) => n)]

  const addExample: (string | number)[] = [
    'ADD', '', 'Asha Kumar', 15000, 'F', 'Raman Kumar', '1990-05-15',
    '2020-01-01', 'Nurse', 'OPD',
    '9876543210', 'asha@example.com',
    '12 Main St, Chennai', '45 River Rd, Madurai',
    'BANK', '12345678901', 'HDFC0001234', 'HDFC Bank',
    '100234567890', '12-00-123456-000-0001', '',
    6000, 1360, 500,
    'PERCENT', 12, 15000, 720,
    55, 10,
    '', '', '',
    '',
  ]

  const updateExample: (string | number)[] = [
    'UPDATE', 'EMP-0001', 'Asha K', 18000, '', '', '',
    '', 'Senior Nurse', '',
    '9000000001', '', '', '', '', '', '', '',
    '', '', '',
    7000, '', '', '', '', '', '',
    '', '',
    '', '', '',
    '',
  ]

  const deleteExample: (string | number)[] = [
    'DELETE', 'EMP-0002',
    ...Array(COLS.length - 2).fill(''),
  ]

  const data = [
    headers,
    addReq,
    updateReq,
    deleteReq,
    notesRow,
    [],
    ['← Delete rows 2–6 (instructions) and example rows before uploading. Keep only your data rows.'],
    addExample,
    updateExample,
    deleteExample,
  ]

  const ws = XLSX.utils.aoa_to_sheet(data)
  ws['!cols'] = COLS.map((_, i) => ({ wch: i === 0 ? 18 : 26 }))

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Employees')

  const buf = Buffer.from(XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }))

  return new NextResponse(buf, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="employee-import-template.xlsx"',
    },
  })
}
