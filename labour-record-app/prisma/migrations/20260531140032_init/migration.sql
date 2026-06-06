-- CreateTable
CREATE TABLE "Establishment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "employerName" TEXT NOT NULL,
    "managerName" TEXT NOT NULL,
    "regCertNo" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "wageFormulaConfig" TEXT NOT NULL DEFAULT '{}',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Employee" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "empId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sex" TEXT NOT NULL,
    "fatherSpouseName" TEXT NOT NULL,
    "dob" DATETIME,
    "dateOfEntry" DATETIME NOT NULL,
    "designation" TEXT NOT NULL,
    "department" TEXT,
    "presentAddress" TEXT NOT NULL,
    "permanentAddress" TEXT NOT NULL,
    "uan" TEXT,
    "esiNo" TEXT,
    "aadhaar" TEXT,
    "bankAccount" TEXT,
    "ifsc" TEXT,
    "bankName" TEXT,
    "mobile" TEXT,
    "email" TEXT,
    "photoPath" TEXT,
    "completionOf480Days" DATETIME,
    "dateMadePermanent" DATETIME,
    "periodOfSuspension" TEXT,
    "specimenSignature" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "exitDate" DATETIME,
    "exitReason" TEXT,
    "remarks" TEXT,
    "establishmentId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Employee_establishmentId_fkey" FOREIGN KEY ("establishmentId") REFERENCES "Establishment" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MonthlyCycle" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "establishmentId" TEXT NOT NULL,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "wagePeriodDays" INTEGER NOT NULL DEFAULT 26,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "MonthlyCycle_establishmentId_fkey" FOREIGN KEY ("establishmentId") REFERENCES "Establishment" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CycleEmployee" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "cycleId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "empDataSnapshot" TEXT NOT NULL DEFAULT '{}',
    CONSTRAINT "CycleEmployee_cycleId_fkey" FOREIGN KEY ("cycleId") REFERENCES "MonthlyCycle" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "CycleEmployee_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "FormTask" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "cycleId" TEXT NOT NULL,
    "formCode" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'NOT_STARTED',
    "assignedTo" TEXT,
    "dueDate" DATETIME,
    "validationErrors" TEXT,
    "lastComment" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "FormTask_cycleId_fkey" FOREIGN KEY ("cycleId") REFERENCES "MonthlyCycle" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "FormTaskStatusHistory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "formTaskId" TEXT NOT NULL,
    "fromStatus" TEXT NOT NULL,
    "toStatus" TEXT NOT NULL,
    "comment" TEXT,
    "changedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FormTaskStatusHistory_formTaskId_fkey" FOREIGN KEY ("formTaskId") REFERENCES "FormTask" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AttendanceRecord" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "cycleId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "workStartTime" TEXT,
    "workEndTime" TEXT,
    "restInterval" TEXT,
    "dailyMarks" TEXT NOT NULL DEFAULT '[]',
    "daysWorked" INTEGER NOT NULL DEFAULT 0,
    "leaveDays" INTEGER NOT NULL DEFAULT 0,
    "absentDays" INTEGER NOT NULL DEFAULT 0,
    "wageDays" INTEGER NOT NULL DEFAULT 0,
    "remarks" TEXT,
    CONSTRAINT "AttendanceRecord_cycleId_fkey" FOREIGN KEY ("cycleId") REFERENCES "MonthlyCycle" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "AttendanceRecord_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "WageRecord" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "cycleId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "daysWorked" INTEGER NOT NULL DEFAULT 0,
    "basic" REAL NOT NULL DEFAULT 0,
    "da" REAL NOT NULL DEFAULT 0,
    "hra" REAL NOT NULL DEFAULT 0,
    "otherAllowances" TEXT NOT NULL DEFAULT '[]',
    "totalNormalWages" REAL NOT NULL DEFAULT 0,
    "totalEarnings" REAL NOT NULL DEFAULT 0,
    "overtimeEarnings" REAL NOT NULL DEFAULT 0,
    "grossWages" REAL NOT NULL DEFAULT 0,
    "pf" REAL NOT NULL DEFAULT 0,
    "esi" REAL NOT NULL DEFAULT 0,
    "lwf" REAL NOT NULL DEFAULT 0,
    "advanceRecovered" REAL NOT NULL DEFAULT 0,
    "fineDeduction" REAL NOT NULL DEFAULT 0,
    "otherDeductions" REAL NOT NULL DEFAULT 0,
    "totalDeductions" REAL NOT NULL DEFAULT 0,
    "netWages" REAL NOT NULL DEFAULT 0,
    "paymentDate" DATETIME,
    "unpaidAccumulations" REAL NOT NULL DEFAULT 0,
    "receiptRef" TEXT,
    CONSTRAINT "WageRecord_cycleId_fkey" FOREIGN KEY ("cycleId") REFERENCES "MonthlyCycle" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "WageRecord_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "LeaveRecord" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "cycleId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "earnedLeaveOpening" INTEGER NOT NULL DEFAULT 0,
    "earnedDuring" INTEGER NOT NULL DEFAULT 0,
    "earnedAvailed" INTEGER NOT NULL DEFAULT 0,
    "earnedClosing" INTEGER NOT NULL DEFAULT 0,
    "medicalLeave" INTEGER NOT NULL DEFAULT 0,
    "otherLeave" INTEGER NOT NULL DEFAULT 0,
    "maternityInfo" TEXT,
    "gratuityInfo" TEXT,
    "nominationInfo" TEXT,
    "remarks" TEXT,
    CONSTRAINT "LeaveRecord_cycleId_fkey" FOREIGN KEY ("cycleId") REFERENCES "MonthlyCycle" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "LeaveRecord_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "OvertimeRecord" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "cycleId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "dailyOt" TEXT NOT NULL DEFAULT '[]',
    "totalOtHours" REAL NOT NULL DEFAULT 0,
    "normalHoursRate" REAL NOT NULL DEFAULT 0,
    "otRate" REAL NOT NULL DEFAULT 0,
    "normalEarnings" REAL NOT NULL DEFAULT 0,
    "otEarnings" REAL NOT NULL DEFAULT 0,
    "totalEarnings" REAL NOT NULL DEFAULT 0,
    "paymentDate" DATETIME,
    CONSTRAINT "OvertimeRecord_cycleId_fkey" FOREIGN KEY ("cycleId") REFERENCES "MonthlyCycle" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "OvertimeRecord_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "FineRecord" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "cycleId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "offenceDate" DATETIME NOT NULL,
    "offenceDescription" TEXT NOT NULL,
    "showCauseDate" DATETIME,
    "wagePeriod" TEXT,
    "wagesOnDate" REAL NOT NULL DEFAULT 0,
    "fineAmount" REAL NOT NULL DEFAULT 0,
    "recovered" REAL NOT NULL DEFAULT 0,
    "pendingRecovery" REAL NOT NULL DEFAULT 0,
    "remarks" TEXT,
    CONSTRAINT "FineRecord_cycleId_fkey" FOREIGN KEY ("cycleId") REFERENCES "MonthlyCycle" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "FineRecord_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DeductionRecord" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "cycleId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "damageDate" DATETIME NOT NULL,
    "description" TEXT NOT NULL,
    "damageAmount" REAL NOT NULL DEFAULT 0,
    "deductionAmount" REAL NOT NULL DEFAULT 0,
    "recovered" REAL NOT NULL DEFAULT 0,
    "pendingRecovery" REAL NOT NULL DEFAULT 0,
    "remarks" TEXT,
    CONSTRAINT "DeductionRecord_cycleId_fkey" FOREIGN KEY ("cycleId") REFERENCES "MonthlyCycle" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "DeductionRecord_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "GeneratedDocument" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "formTaskId" TEXT NOT NULL,
    "formCode" TEXT NOT NULL,
    "docxPath" TEXT,
    "pdfPath" TEXT,
    "templateVersion" TEXT NOT NULL,
    "versionNo" INTEGER NOT NULL DEFAULT 1,
    "generatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fileName" TEXT NOT NULL,
    CONSTRAINT "GeneratedDocument_formTaskId_fkey" FOREIGN KEY ("formTaskId") REFERENCES "FormTask" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "previousValue" TEXT,
    "newValue" TEXT,
    "changedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "MonthlyCycle_establishmentId_month_year_key" ON "MonthlyCycle"("establishmentId", "month", "year");

-- CreateIndex
CREATE UNIQUE INDEX "CycleEmployee_cycleId_employeeId_key" ON "CycleEmployee"("cycleId", "employeeId");

-- CreateIndex
CREATE UNIQUE INDEX "AttendanceRecord_cycleId_employeeId_key" ON "AttendanceRecord"("cycleId", "employeeId");

-- CreateIndex
CREATE UNIQUE INDEX "WageRecord_cycleId_employeeId_key" ON "WageRecord"("cycleId", "employeeId");

-- CreateIndex
CREATE UNIQUE INDEX "LeaveRecord_cycleId_employeeId_key" ON "LeaveRecord"("cycleId", "employeeId");

-- CreateIndex
CREATE UNIQUE INDEX "OvertimeRecord_cycleId_employeeId_key" ON "OvertimeRecord"("cycleId", "employeeId");
