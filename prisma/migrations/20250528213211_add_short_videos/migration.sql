-- CreateTable
CREATE TABLE "ShortVideo" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "videoS3Key" TEXT NOT NULL,
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

-- CreateTable
CREATE TABLE "ShortVideoRating" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "liked" BOOLEAN NOT NULL,
    "shortVideoId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ShortVideoRating_shortVideoId_fkey" FOREIGN KEY ("shortVideoId") REFERENCES "ShortVideo" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ShortVideoRating_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ShortVideoRating_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "ShortVideo_userId_idx" ON "ShortVideo"("userId");

-- CreateIndex
CREATE INDEX "ShortVideo_topic_idx" ON "ShortVideo"("topic");

-- CreateIndex
CREATE INDEX "ShortVideoRating_shortVideoId_idx" ON "ShortVideoRating"("shortVideoId");

-- CreateIndex
CREATE INDEX "ShortVideoRating_userId_idx" ON "ShortVideoRating"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ShortVideoRating_userId_shortVideoId_key" ON "ShortVideoRating"("userId", "shortVideoId");
