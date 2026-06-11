-- CreateTable
CREATE TABLE "CalendarEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "time" TEXT,
    "type" TEXT NOT NULL DEFAULT 'custom',
    "establishmentId" TEXT,
    "remindDaysBefore" INTEGER,
    "recurring" TEXT NOT NULL DEFAULT 'none',
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "CalendarEvent_establishmentId_fkey" FOREIGN KEY ("establishmentId") REFERENCES "Establishment" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "CalendarEvent_date_idx" ON "CalendarEvent"("date");
