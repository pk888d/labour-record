// Pure mapper from spreadsheet rows (already parsed to objects keyed by header)
// into validated employee inputs. Header matching is case-insensitive and
// whitespace-trimmed. Row numbers are 1-based with the header counted as row 1.
//
// Action column rules:
//   ADD    – name + salary required; empId auto-generated if blank
//   UPDATE – empId required; non-blank fields are patched
//   DELETE – empId required; all other fields ignored

export type ImportAction = 'ADD' | 'UPDATE' | 'DELETE'

export interface ParsedEmployee {
  action: ImportAction
  // Identity
  empId: string | null
  name: string | null
  sex: string | null
  fatherSpouseName: string | null
  dob: string | null
  dateOfEntry: string | null
  // Work
  designation: string | null
  department: string | null
  // Contact
  mobile: string | null
  email: string | null
  // Address
  presentAddress: string | null
  permanentAddress: string | null
  // Payment
  paymentMode: 'BANK' | 'CASH' | null
  bankAccount: string | null
  ifsc: string | null
  bankName: string | null
  // Statutory IDs
  uan: string | null
  esiNo: string | null
  aadhaar: string | null
  // Salary
  defaultTotalSalary: number | null
  basicWage: number | null
  daWage: number | null
  hraWage: number | null
  // PF
  pfMode: string | null
  pfPercent: number | null
  pfWageCeiling: number | null
  pfAmount: number | null
  // ESI / LWF
  esiAmount: number | null
  lwfAmount: number | null
  // Service dates
  completionOf480Days: string | null
  dateMadePermanent: string | null
  periodOfSuspension: string | null
  // Other
  remarks: string | null
}

export interface RowError { row: number; messages: string[] }

const ALIASES = {
  action:              ['action'],
  name:                ['name'],
  empId:               ['emp id', 'empid', 'employee id', 'employee code', 'emp code'],
  sex:                 ['sex', 'gender'],
  fatherSpouseName:    ['father/spouse', 'father / spouse', 'father/spouse name', 'father name', 'spouse name'],
  dob:                 ['dob', 'date of birth', 'birth date'],
  dateOfEntry:         ['date of entry', 'doj', 'joining date'],
  designation:         ['designation', 'role'],
  department:          ['department', 'dept', 'section'],
  mobile:              ['phone', 'mobile', 'mobile number', 'contact'],
  email:               ['email', 'e-mail', 'email id'],
  presentAddress:      ['present address', 'current address', 'address'],
  permanentAddress:    ['permanent address', 'native address', 'home address'],
  paymentMode:         ['payment mode', 'mode', 'payment'],
  bankAccount:         ['bank a/c', 'bank account', 'account', 'a/c', 'account no'],
  ifsc:                ['ifsc', 'ifsc code'],
  bankName:            ['bank name', 'bank'],
  uan:                 ['uan', 'epf uan', 'pf uan'],
  esiNo:               ['esi no', 'esino', 'esi number', 'esi no.'],
  aadhaar:             ['aadhaar', 'aadhar', 'aadhaar no', 'aadhar no'],
  salary:              ['salary', 'total salary', 'gross', 'gross salary', 'default salary'],
  basicWage:           ['basic', 'basic wage', 'basic salary'],
  daWage:              ['da', 'da wage', 'dearness allowance'],
  hraWage:             ['hra', 'hra wage', 'house rent allowance'],
  pfMode:              ['pf mode', 'pfmode'],
  pfPercent:           ['pf %', 'pf percent', 'pfpercent', 'pf percentage'],
  pfWageCeiling:       ['pf wage ceiling', 'pf ceiling', 'pfceiling'],
  pfAmount:            ['pf amount', 'pf', 'pf deduction'],
  esiAmount:           ['esi amount', 'esi deduction'],
  lwfAmount:           ['lwf', 'lwf amount', 'labour welfare fund'],
  completionOf480Days: ['480 days', '480 days completion', 'completion of 480 days'],
  dateMadePermanent:   ['date made permanent', 'permanent date', 'confirmation date'],
  periodOfSuspension:  ['period of suspension', 'suspension period', 'suspension'],
  remarks:             ['remarks', 'notes', 'comments'],
} as const

function pick(row: Record<string, string>, aliases: readonly string[]): string {
  const lower = new Map(Object.entries(row).map(([k, v]) => [k.trim().toLowerCase(), v]))
  for (const a of aliases) {
    const v = lower.get(a)
    if (v !== undefined && String(v).trim() !== '') return String(v).trim()
  }
  return ''
}

function num(raw: string): number | null {
  const n = Number(raw)
  return raw !== '' && Number.isFinite(n) ? n : null
}

export function parseEmployeeRows(
  rows: Record<string, string>[],
): { valid: ParsedEmployee[]; errors: RowError[] } {
  const valid: ParsedEmployee[] = []
  const errors: RowError[] = []

  rows.forEach((row, i) => {
    const rowNum = i + 2 // header = row 1; first data row = row 2
    const actionRaw = pick(row, ALIASES.action).toUpperCase()

    // Silently skip blank rows and template instruction/notes rows
    // (instruction rows have values like "ADD →", "Notes", "ADD / UPDATE / DELETE")
    if (!['ADD', 'UPDATE', 'DELETE'].includes(actionRaw)) return

    const action = actionRaw as ImportAction
    const empId = pick(row, ALIASES.empId) || null
    const name  = pick(row, ALIASES.name)  || null
    const salaryRaw = pick(row, ALIASES.salary)
    const salary    = num(salaryRaw)

    const messages: string[] = []
    if (action === 'ADD') {
      if (!name) messages.push('name is required for ADD')
      if (salary === null || salary <= 0) messages.push('salary is required for ADD')
    } else {
      if (!empId) messages.push(`Emp ID is required for ${action}`)
    }
    if (messages.length > 0) { errors.push({ row: rowNum, messages }); return }

    const modeRaw = pick(row, ALIASES.paymentMode).toUpperCase()

    valid.push({
      action,
      empId,
      name,
      sex:                 pick(row, ALIASES.sex) || null,
      fatherSpouseName:    pick(row, ALIASES.fatherSpouseName) || null,
      dob:                 pick(row, ALIASES.dob) || null,
      dateOfEntry:         pick(row, ALIASES.dateOfEntry) || null,
      designation:         pick(row, ALIASES.designation) || null,
      department:          pick(row, ALIASES.department) || null,
      mobile:              pick(row, ALIASES.mobile) || null,
      email:               pick(row, ALIASES.email) || null,
      presentAddress:      pick(row, ALIASES.presentAddress) || null,
      permanentAddress:    pick(row, ALIASES.permanentAddress) || null,
      paymentMode:         modeRaw === 'CASH' ? 'CASH' : modeRaw === 'BANK' ? 'BANK' : null,
      bankAccount:         pick(row, ALIASES.bankAccount) || null,
      ifsc:                pick(row, ALIASES.ifsc) || null,
      bankName:            pick(row, ALIASES.bankName) || null,
      uan:                 pick(row, ALIASES.uan) || null,
      esiNo:               pick(row, ALIASES.esiNo) || null,
      aadhaar:             pick(row, ALIASES.aadhaar) || null,
      defaultTotalSalary:  salary,
      basicWage:           num(pick(row, ALIASES.basicWage)),
      daWage:              num(pick(row, ALIASES.daWage)),
      hraWage:             num(pick(row, ALIASES.hraWage)),
      pfMode:              pick(row, ALIASES.pfMode).toUpperCase() || null,
      pfPercent:           num(pick(row, ALIASES.pfPercent)),
      pfWageCeiling:       num(pick(row, ALIASES.pfWageCeiling)),
      pfAmount:            num(pick(row, ALIASES.pfAmount)),
      esiAmount:           num(pick(row, ALIASES.esiAmount)),
      lwfAmount:           num(pick(row, ALIASES.lwfAmount)),
      completionOf480Days: pick(row, ALIASES.completionOf480Days) || null,
      dateMadePermanent:   pick(row, ALIASES.dateMadePermanent) || null,
      periodOfSuspension:  pick(row, ALIASES.periodOfSuspension) || null,
      remarks:             pick(row, ALIASES.remarks) || null,
    })
  })

  return { valid, errors }
}
