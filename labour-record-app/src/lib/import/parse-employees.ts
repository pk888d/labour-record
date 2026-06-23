// Pure mapper from spreadsheet rows (already parsed to objects keyed by header)
// into validated employee inputs. Header matching is case-insensitive and
// whitespace-trimmed. Required: Name, Salary. Row numbers are 1-based with the
// header counted as row 1 (so the first data row is row 2).

export interface ParsedEmployee {
  empId: string | null
  name: string
  sex: string | null
  fatherSpouseName: string | null
  designation: string | null
  dateOfEntry: string | null
  mobile: string | null
  bankAccount: string | null
  ifsc: string | null
  paymentMode: 'BANK' | 'CASH'
  defaultTotalSalary: number
}

export interface RowError { row: number; messages: string[] }

const ALIASES = {
  name: ['name'],
  empId: ['emp id', 'empid', 'employee id', 'id'],
  sex: ['sex', 'gender'],
  fatherSpouseName: ['father/spouse', 'father / spouse', 'father/spouse name', 'father name', 'spouse name'],
  designation: ['designation', 'role'],
  dateOfEntry: ['date of entry', 'doj', 'joining date'],
  mobile: ['phone', 'mobile', 'mobile number'],
  bankAccount: ['bank a/c', 'bank account', 'account', 'a/c'],
  ifsc: ['ifsc', 'ifsc code'],
  salary: ['salary', 'total salary', 'gross', 'gross salary'],
  paymentMode: ['payment mode', 'mode', 'payment'],
} as const

function pick(row: Record<string, string>, aliases: readonly string[]): string {
  const lower = new Map(Object.entries(row).map(([k, v]) => [k.trim().toLowerCase(), v]))
  for (const a of aliases) {
    const v = lower.get(a)
    if (v !== undefined && String(v).trim() !== '') return String(v).trim()
  }
  return ''
}

export function parseEmployeeRows(rows: Record<string, string>[]): { valid: ParsedEmployee[]; errors: RowError[] } {
  const valid: ParsedEmployee[] = []
  const errors: RowError[] = []

  rows.forEach((row, i) => {
    const rowNum = i + 2 // header is row 1
    const name = pick(row, ALIASES.name)
    const salaryRaw = pick(row, ALIASES.salary)
    const salary = Number(salaryRaw)
    const messages: string[] = []
    if (!name) messages.push('name is required')
    if (!(salaryRaw !== '' && Number.isFinite(salary) && salary > 0)) messages.push('a salary figure is required')
    if (messages.length > 0) { errors.push({ row: rowNum, messages }); return }

    const modeRaw = pick(row, ALIASES.paymentMode).toUpperCase()
    valid.push({
      empId: pick(row, ALIASES.empId) || null,
      name,
      sex: pick(row, ALIASES.sex) || null,
      fatherSpouseName: pick(row, ALIASES.fatherSpouseName) || null,
      designation: pick(row, ALIASES.designation) || null,
      dateOfEntry: pick(row, ALIASES.dateOfEntry) || null,
      mobile: pick(row, ALIASES.mobile) || null,
      bankAccount: pick(row, ALIASES.bankAccount) || null,
      ifsc: pick(row, ALIASES.ifsc) || null,
      paymentMode: modeRaw === 'CASH' ? 'CASH' : 'BANK',
      defaultTotalSalary: salary,
    })
  })

  return { valid, errors }
}
