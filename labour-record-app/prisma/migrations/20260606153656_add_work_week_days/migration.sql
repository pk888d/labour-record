-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Establishment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "employerName" TEXT NOT NULL,
    "managerName" TEXT NOT NULL,
    "regCertNo" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "wageFormulaConfig" TEXT NOT NULL DEFAULT '{}',
    "workWeekDays" INTEGER NOT NULL DEFAULT 6,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Establishment" ("address", "createdAt", "employerName", "id", "isActive", "managerName", "name", "regCertNo", "type", "updatedAt", "wageFormulaConfig") SELECT "address", "createdAt", "employerName", "id", "isActive", "managerName", "name", "regCertNo", "type", "updatedAt", "wageFormulaConfig" FROM "Establishment";
DROP TABLE "Establishment";
ALTER TABLE "new_Establishment" RENAME TO "Establishment";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
