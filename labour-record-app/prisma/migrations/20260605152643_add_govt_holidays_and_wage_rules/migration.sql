-- CreateTable
CREATE TABLE "GovtHoliday" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "date" DATETIME NOT NULL,
    "name" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "WageRule" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "establishmentId" TEXT NOT NULL,
    "ruleKey" TEXT NOT NULL,
    "ruleValue" REAL NOT NULL,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "WageRule_establishmentId_fkey" FOREIGN KEY ("establishmentId") REFERENCES "Establishment" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_WageRecord" (
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
    "holidayBonus" REAL NOT NULL DEFAULT 0,
    "paymentDate" DATETIME,
    "unpaidAccumulations" REAL NOT NULL DEFAULT 0,
    "receiptRef" TEXT,
    CONSTRAINT "WageRecord_cycleId_fkey" FOREIGN KEY ("cycleId") REFERENCES "MonthlyCycle" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "WageRecord_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_WageRecord" ("advanceRecovered", "basic", "cycleId", "da", "daysWorked", "employeeId", "esi", "fineDeduction", "grossWages", "hra", "id", "lwf", "netWages", "otherAllowances", "otherDeductions", "overtimeEarnings", "paymentDate", "pf", "receiptRef", "totalDeductions", "totalEarnings", "totalNormalWages", "unpaidAccumulations") SELECT "advanceRecovered", "basic", "cycleId", "da", "daysWorked", "employeeId", "esi", "fineDeduction", "grossWages", "hra", "id", "lwf", "netWages", "otherAllowances", "otherDeductions", "overtimeEarnings", "paymentDate", "pf", "receiptRef", "totalDeductions", "totalEarnings", "totalNormalWages", "unpaidAccumulations" FROM "WageRecord";
DROP TABLE "WageRecord";
ALTER TABLE "new_WageRecord" RENAME TO "WageRecord";
CREATE UNIQUE INDEX "WageRecord_cycleId_employeeId_key" ON "WageRecord"("cycleId", "employeeId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "GovtHoliday_date_key" ON "GovtHoliday"("date");

-- CreateIndex
CREATE UNIQUE INDEX "WageRule_establishmentId_ruleKey_key" ON "WageRule"("establishmentId", "ruleKey");
