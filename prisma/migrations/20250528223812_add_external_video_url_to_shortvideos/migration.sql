-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ShortVideo" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "videoS3Key" TEXT,
    "externalVideoUrl" TEXT,
    "thumbnailS3Key" TEXT,
    "duration" INTEGER,
    "topic" TEXT NOT NULL,
    "authorName" TEXT NOT NULL,
    "authorInstitution" TEXT NOT NULL,
    "authorInfo" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ShortVideo_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ShortVideo_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_ShortVideo" ("authorInfo", "authorInstitution", "authorName", "createdAt", "description", "duration", "id", "thumbnailS3Key", "title", "topic", "updatedAt", "userId", "videoS3Key") SELECT "authorInfo", "authorInstitution", "authorName", "createdAt", "description", "duration", "id", "thumbnailS3Key", "title", "topic", "updatedAt", "userId", "videoS3Key" FROM "ShortVideo";
DROP TABLE "ShortVideo";
ALTER TABLE "new_ShortVideo" RENAME TO "ShortVideo";
CREATE INDEX "ShortVideo_userId_idx" ON "ShortVideo"("userId");
CREATE INDEX "ShortVideo_topic_idx" ON "ShortVideo"("topic");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
