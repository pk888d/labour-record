-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Employee" (
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
    "defaultTotalSalary" REAL NOT NULL DEFAULT 0,
    "basicWage" REAL NOT NULL DEFAULT 0,
    "daWage" REAL NOT NULL DEFAULT 0,
    "hraWage" REAL NOT NULL DEFAULT 0,
    "pfMode" TEXT NOT NULL DEFAULT 'PERCENT',
    "pfPercent" REAL NOT NULL DEFAULT 12,
    "pfWageCeiling" REAL NOT NULL DEFAULT 15000,
    "pfAmount" REAL NOT NULL DEFAULT 0,
    "esiAmount" REAL NOT NULL DEFAULT 0,
    "lwfAmount" REAL NOT NULL DEFAULT 0,
    "establishmentId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Employee_establishmentId_fkey" FOREIGN KEY ("establishmentId") REFERENCES "Establishment" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Employee" ("aadhaar", "bankAccount", "bankName", "basicWage", "completionOf480Days", "createdAt", "daWage", "dateMadePermanent", "dateOfEntry", "department", "designation", "dob", "email", "empId", "esiAmount", "esiNo", "establishmentId", "exitDate", "exitReason", "fatherSpouseName", "hraWage", "id", "ifsc", "lwfAmount", "mobile", "name", "periodOfSuspension", "permanentAddress", "pfAmount", "photoPath", "presentAddress", "remarks", "sex", "specimenSignature", "status", "uan", "updatedAt") SELECT "aadhaar", "bankAccount", "bankName", "basicWage", "completionOf480Days", "createdAt", "daWage", "dateMadePermanent", "dateOfEntry", "department", "designation", "dob", "email", "empId", "esiAmount", "esiNo", "establishmentId", "exitDate", "exitReason", "fatherSpouseName", "hraWage", "id", "ifsc", "lwfAmount", "mobile", "name", "periodOfSuspension", "permanentAddress", "pfAmount", "photoPath", "presentAddress", "remarks", "sex", "specimenSignature", "status", "uan", "updatedAt" FROM "Employee";
DROP TABLE "Employee";
ALTER TABLE "new_Employee" RENAME TO "Employee";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
