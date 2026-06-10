-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_GovtHoliday" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "date" DATETIME NOT NULL,
    "name" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "doubleWage" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_GovtHoliday" ("createdAt", "date", "id", "name", "year") SELECT "createdAt", "date", "id", "name", "year" FROM "GovtHoliday";
DROP TABLE "GovtHoliday";
ALTER TABLE "new_GovtHoliday" RENAME TO "GovtHoliday";
CREATE UNIQUE INDEX "GovtHoliday_date_key" ON "GovtHoliday"("date");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
