================================================================================
  LabourRecord — Tamil Nadu Statutory Compliance Manager
  Version 0.1.0
================================================================================

WHAT IS THIS?
─────────────
LabourRecord is a web application that helps employers in Tamil Nadu maintain
all statutory registers and wage records required under:

  • The Clinical Establishments (Registration & Regulation) Act
    — for hospitals, clinics, diagnostic labs

  • The Tamil Nadu Shops & Establishments Act
    — for shops, offices, commercial establishments

It replaces paper registers with digital data entry and generates print-ready
government forms (Form XI, Form XII, Form XVII, Form IV, Form I, Form II for
hospitals; Form U, Form W, Form T, Form X for shops).

Key features:
  • Multi-establishment support (manage multiple hospitals/shops in one install)
  • Employee master with statutory fields (UAN, ESI No, IFSC, PF details)
  • Monthly cycles: attendance, wages, overtime, leave, fines, deductions
  • Wage proration by actual days worked
  • Auto-calculation of PF and ESI deductions from configurable rates
  • Government holiday management with double-wage enforcement
  • Per-establishment wage rule overrides (PF %, ESI %, OT multiplier, etc.)
  • Salary slip generation — view individually or print all at once
  • Print-ready statutory forms (no export to Word/PDF needed for printing)
  • Live wage rule simulator to test how rule changes affect salary


TECH STACK
──────────
  Runtime:    Node.js 20+ (LTS)
  Framework:  Next.js 16 (App Router, React 19)
  Database:   SQLite via Prisma 7 + better-sqlite3
  Styling:    Tailwind CSS 4
  Language:   TypeScript 5


PREREQUISITES
─────────────
  • macOS 12 or later (Apple Silicon or Intel)
  • Node.js v20 or later  →  https://nodejs.org
  • npm v10 or later (comes with Node.js)
  • Internet connection for first-time npm install

  Optional but recommended:
  • SQLite CLI (for database inspection/debugging):  brew install sqlite


QUICK START
───────────
The project ships as two sibling folders:

  labour-record/
  ├── man/                  ← documentation & install script (this folder)
  └── labour-record-app/   ← the application

1. Copy the entire labour-record/ folder to the target machine.

2. Open Terminal and run the install script from anywhere:
     bash /path/to/labour-record/man/install.sh

   Example (if copied to your home folder):
     bash ~/labour-record/man/install.sh

   If you get "permission denied":
     chmod +x ~/labour-record/man/install.sh
     ~/labour-record/man/install.sh

3. Start the application (run these from inside labour-record-app/):
     cd ~/labour-record/labour-record-app
     npm run dev           ← development mode (shows errors in browser)
     npm start             ← production mode (after running npm run build)

4. Open your browser:
     http://localhost:3000


FIRST RUN
─────────
The install script seeds two demo establishments and six demo employees
(DNV Orthocare hospital and Sri Ranga Department Store shop). You can delete
these after exploring the application, or keep them as examples.

See man/user_guide.md for step-by-step instructions on creating your own
establishments, employees, and monthly cycles.


FILE STRUCTURE
──────────────
  labour-record/                              ← root folder to copy/share
  │
  ├── man/                                    ← documentation & install script
  │   ├── install.sh                          ← One-click install (run this first)
  │   ├── user_guide.md                       ← Detailed usage guide
  │   └── readme.txt                          ← This file
  │
  └── labour-record-app/                      ← the application
      │
      ├── package.json                        ← Node.js dependencies
      ├── next.config.ts                      ← Next.js configuration
      ├── tsconfig.json                       ← TypeScript configuration
      ├── .env                                ← Database path (created by install.sh)
      │
      ├── prisma/
      │   ├── schema.prisma                   ← Database schema (16 models)
      │   ├── dev.db                          ← SQLite database file
      │   ├── migrations/                     ← Database migration history
      │   └── seed.ts                         ← Demo data seeder
      │
      ├── src/
      │   ├── app/                            ← Next.js pages and API routes
      │   │   ├── page.tsx                    ← Dashboard (home page)
      │   │   ├── layout.tsx                  ← App shell with sidebar
      │   │   ├── globals.css                 ← Global styles + print rules
      │   │   ├── establishments/             ← Establishment list/create/edit
      │   │   ├── employees/                  ← Employee list/create/edit
      │   │   ├── cycles/                     ← Monthly cycle list/detail
      │   │   │   └── [id]/
      │   │   │       ├── salary-slips/       ← All-employees slip grid
      │   │   │       │   └── [employeeId]/   ← Individual slip view + print
      │   │   │       └── ...
      │   │   ├── forms/[taskId]/             ← 6-tab data entry form
      │   │   ├── holidays/                   ← Government holidays management
      │   │   ├── wage-rules/                 ← Wage rules + live simulator
      │   │   ├── print/[cycleId]/[formCode]/ ← Print-ready statutory forms
      │   │   ├── exports/                    ← Export history page
      │   │   └── api/                        ← REST API routes
      │   │       ├── establishments/         ← GET, POST, PUT, DELETE
      │   │       ├── employees/              ← GET, POST, PUT, DELETE
      │   │       ├── cycles/                 ← GET, POST, DELETE
      │   │       │   └── [id]/sync-employees/← POST (sync new employees)
      │   │       ├── form-tasks/[id]/
      │   │       │   ├── attendance/         ← GET, PUT
      │   │       │   ├── wages/              ← GET, PUT
      │   │       │   ├── overtime/           ← GET, PUT
      │   │       │   ├── leave/              ← GET, PUT
      │   │       │   ├── fines/              ← GET, POST
      │   │       │   └── deductions/         ← GET, POST
      │   │       ├── holidays/               ← GET, POST, DELETE
      │   │       ├── wage-rules/             ← GET, PUT, DELETE
      │   │       ├── fine-records/[id]/      ← DELETE
      │   │       └── deduction-records/[id]/ ← DELETE
      │   │
      │   ├── components/                     ← Shared UI components
      │   │   ├── sidebar.tsx                 ← Navigation sidebar
      │   │   ├── page-header.tsx             ← Page title + subtitle bar
      │   │   ├── info-tooltip.tsx            ← ⓘ hover tooltip
      │   │   ├── establishment-form.tsx      ← Establishment create/edit form
      │   │   ├── employee-form.tsx           ← Employee create/edit form
      │   │   └── cycle-form.tsx              ← Cycle create form
      │   │
      │   ├── domain/                         ← Business logic (pure functions)
      │   │   ├── calculations/
      │   │   │   ├── wage-calculator.ts      ← Gross/net wage calculation
      │   │   │   ├── attendance-calculator.ts← Days worked, wage days
      │   │   │   ├── overtime-calculator.ts  ← OT earnings calculation
      │   │   │   ├── leave-calculator.ts     ← Earned leave closing balance
      │   │   │   └── wage-defaults.ts        ← System default PF/ESI/OT rates
      │   │   ├── validations/
      │   │   │   ├── employee.ts             ← Employee field validation rules
      │   │   │   └── cycle.ts                ← Cycle field validation rules
      │   │   └── workflow/
      │   │       └── kanban-transitions.ts   ← Form task status transitions
      │   │
      │   ├── lib/
      │   │   ├── prisma.ts                   ← Prisma client singleton
      │   │   ├── utils.ts                    ← Tailwind class merge utility
      │   │   └── export/
      │   │       ├── form-data.ts            ← Data extraction for all forms
      │   │       ├── docx-generator.ts       ← DOCX export (docxtemplater)
      │   │       └── pdf-generator.ts        ← PDF export (LibreOffice)
      │   │
      │   ├── types/
      │   │   └── index.ts                    ← Shared TypeScript types + form codes
      │   │
      │   └── generated/
      │       └── prisma/                     ← Auto-generated Prisma client
      │
      ├── templates/                          ← DOCX templates for export
      │   ├── hospital/                       ← Hospital form templates (.docx)
      │   └── shop/                           ← Shop form templates (.docx)
      │
      ├── exports/                            ← Generated documents (gitignored)
      ├── tests/                              ← Unit tests (vitest)
      ├── e2e/                                ← End-to-end tests (Playwright)
      └── docs/superpowers/
          ├── specs/                          ← Feature design documents
          └── plans/                          ← Implementation plans


DATABASE
────────
The application uses SQLite stored at labour-record-app/prisma/dev.db. This is
a single file — to back up the entire database, copy that one file.

Key tables:
  Establishment       ← Hospital or shop
  Employee            ← Worker records with statutory details
  MonthlyCycle        ← One payroll period (month + year) per establishment
  CycleEmployee       ← Employee snapshot for a cycle
  FormTask            ← One row per statutory form per cycle
  AttendanceRecord    ← Daily attendance marks per employee per cycle
  WageRecord          ← Wage breakdown per employee per cycle
  OvertimeRecord      ← Daily OT hours per employee per cycle
  LeaveRecord         ← EL/medical/other leave per employee per cycle
  FineRecord          ← Individual fine entries
  DeductionRecord     ← Individual deduction/damage entries
  GovtHoliday         ← Government holiday calendar
  WageRule            ← Per-establishment overrides for PF/ESI/OT rates
  GeneratedDocument   ← Export history


BACKUP & RESTORE
────────────────
Run these commands from inside the labour-record-app/ directory:

  cd ~/labour-record/labour-record-app

To back up all data:
  cp prisma/dev.db prisma/dev.db.backup.$(date +%Y%m%d)

To restore:
  cp prisma/dev.db.backup.YYYYMMDD prisma/dev.db

To move to another machine:
  1. Copy the entire labour-record/ folder (both man/ and labour-record-app/).
  2. On the new machine, run: bash ~/labour-record/man/install.sh
     (skips demo seed if dev.db already has data)
  3. cd ~/labour-record/labour-record-app && npm run dev


RUNNING IN PRODUCTION
─────────────────────
For a shared office machine that runs 24/7 (run from labour-record-app/):

  1. Build the app:         npm run build
  2. Start the server:      npm start
  3. The app runs on port 3000. To change the port:
       PORT=8080 npm start

  To run as a background service, install pm2:
       npm install -g pm2
       pm2 start "npm start" --name labour-record
       pm2 save
       pm2 startup     ← follow the printed command to auto-start on boot


KNOWN LIMITATIONS
─────────────────
  • Single-user: no login/authentication. Suitable for a trusted local network.
  • DOCX/PDF export requires LibreOffice to be installed (for PDF generation).
    Printing from the browser is recommended instead.
  • Government holiday attendance defaults are applied on first form open only.
    Changing holidays does not retroactively update saved attendance records.
  • Wage records are not retroactively recalculated when wage rules change.


SUPPORT & DOCUMENTATION
────────────────────────
  man/user_guide.md   ← Step-by-step usage instructions (start here)
  man/readme.txt      ← This overview (install, file structure, operations)
  man/install.sh      ← Automated setup for macOS

================================================================================
