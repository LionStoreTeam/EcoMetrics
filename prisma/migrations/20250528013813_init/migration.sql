-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'USER',
    "userType" TEXT NOT NULL DEFAULT 'INDIVIDUAL',
    "points" INTEGER NOT NULL DEFAULT 0,
    "level" INTEGER NOT NULL DEFAULT 1,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Profile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "bio" TEXT,
    "address" TEXT,
    "city" TEXT,
    "state" TEXT,
    "zipCode" TEXT,
    "phone" TEXT,
    "avatarUrl" TEXT,
    "userId" TEXT NOT NULL,
    CONSTRAINT "Profile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Group" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "GroupMember" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "role" TEXT NOT NULL DEFAULT 'MEMBER',
    "joinedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    CONSTRAINT "GroupMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "GroupMember_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Activity" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL,
    "quantity" REAL NOT NULL,
    "unit" TEXT NOT NULL,
    "points" INTEGER NOT NULL,
    "date" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING_REVIEW',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "userId" TEXT NOT NULL,
    "groupId" TEXT,
    CONSTRAINT "Activity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Activity_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Evidence" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "activityId" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "format" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Evidence_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "Activity" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Reward" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "pointsCost" INTEGER NOT NULL,
    "available" BOOLEAN NOT NULL DEFAULT true,
    "quantity" INTEGER,
    "expiresAt" DATETIME,
    "category" TEXT NOT NULL DEFAULT 'OTHER',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "userId" TEXT,
    CONSTRAINT "Reward_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Redemption" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "redeemedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "rewardId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    CONSTRAINT "Redemption_rewardId_fkey" FOREIGN KEY ("rewardId") REFERENCES "Reward" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Badge" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "criteria" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "RecyclingCenter" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "address" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "zipCode" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "website" TEXT,
    "latitude" REAL,
    "longitude" REAL,
    "openingHours" TEXT
);

-- CreateTable
CREATE TABLE "Material" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "CenterMaterial" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "centerId" TEXT NOT NULL,
    "materialId" TEXT NOT NULL,
    CONSTRAINT "CenterMaterial_centerId_fkey" FOREIGN KEY ("centerId") REFERENCES "RecyclingCenter" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CenterMaterial_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "Material" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "userId" TEXT NOT NULL,
    CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "BusinessPromotionRequest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "businessName" TEXT NOT NULL,
    "logoUrl" TEXT,
    "description" TEXT NOT NULL,
    "businessType" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "zipCode" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "website" TEXT,
    "latitude" REAL,
    "longitude" REAL,
    "openingHours" TEXT,
    "socialMedia" TEXT,
    "paymentIntentId" TEXT,
    "paymentStatus" TEXT,
    "amountPaid" REAL,
    "currency" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING_APPROVAL',
    "submittedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" DATETIME,
    "reviewerNotes" TEXT
);

-- CreateTable
CREATE TABLE "ProductImage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "url" TEXT NOT NULL,
    "productPromotionRequestId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ProductImage_productPromotionRequestId_fkey" FOREIGN KEY ("productPromotionRequestId") REFERENCES "ProductPromotionRequest" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ProductPromotionRequest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "businessName" TEXT NOT NULL,
    "productName" TEXT NOT NULL,
    "businessLogoUrl" TEXT,
    "description" TEXT NOT NULL,
    "businessType" TEXT NOT NULL,
    "priceOrPromotion" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "validUntil" DATETIME,
    "zipCode" TEXT,
    "phone" TEXT,
    "latitude" REAL,
    "longitude" REAL,
    "openingHours" TEXT,
    "contactEmail" TEXT,
    "website" TEXT,
    "socialMediaLinks" TEXT,
    "paymentIntentId" TEXT,
    "paymentStatus" TEXT,
    "amountPaid" REAL,
    "currency" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING_APPROVAL',
    "submittedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" DATETIME,
    "reviewerNotes" TEXT
);

-- CreateTable
CREATE TABLE "EducationalArticle" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "authorName" TEXT NOT NULL,
    "authorInstitution" TEXT NOT NULL,
    "authorInfo" TEXT,
    "coverImageUrl" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "EducationalArticle_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ArticleRating" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "liked" BOOLEAN NOT NULL,
    "articleId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ArticleRating_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "EducationalArticle" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ArticleRating_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_ProfileBadges" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_ProfileBadges_A_fkey" FOREIGN KEY ("A") REFERENCES "Badge" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_ProfileBadges_B_fkey" FOREIGN KEY ("B") REFERENCES "Profile" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Profile_userId_key" ON "Profile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "GroupMember_userId_groupId_key" ON "GroupMember"("userId", "groupId");

-- CreateIndex
CREATE INDEX "Activity_userId_idx" ON "Activity"("userId");

-- CreateIndex
CREATE INDEX "Activity_groupId_idx" ON "Activity"("groupId");

-- CreateIndex
CREATE INDEX "Activity_status_idx" ON "Activity"("status");

-- CreateIndex
CREATE INDEX "Evidence_activityId_idx" ON "Evidence"("activityId");

-- CreateIndex
CREATE UNIQUE INDEX "CenterMaterial_centerId_materialId_key" ON "CenterMaterial"("centerId", "materialId");

-- CreateIndex
CREATE INDEX "Notification_userId_idx" ON "Notification"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "BusinessPromotionRequest_paymentIntentId_key" ON "BusinessPromotionRequest"("paymentIntentId");

-- CreateIndex
CREATE INDEX "BusinessPromotionRequest_status_idx" ON "BusinessPromotionRequest"("status");

-- CreateIndex
CREATE INDEX "BusinessPromotionRequest_businessType_idx" ON "BusinessPromotionRequest"("businessType");

-- CreateIndex
CREATE INDEX "BusinessPromotionRequest_state_city_idx" ON "BusinessPromotionRequest"("state", "city");

-- CreateIndex
CREATE INDEX "ProductImage_productPromotionRequestId_idx" ON "ProductImage"("productPromotionRequestId");

-- CreateIndex
CREATE UNIQUE INDEX "ProductPromotionRequest_paymentIntentId_key" ON "ProductPromotionRequest"("paymentIntentId");

-- CreateIndex
CREATE INDEX "ProductPromotionRequest_status_idx" ON "ProductPromotionRequest"("status");

-- CreateIndex
CREATE INDEX "ProductPromotionRequest_businessType_idx" ON "ProductPromotionRequest"("businessType");

-- CreateIndex
CREATE INDEX "ProductPromotionRequest_state_city_idx" ON "ProductPromotionRequest"("state", "city");

-- CreateIndex
CREATE INDEX "ProductPromotionRequest_businessName_idx" ON "ProductPromotionRequest"("businessName");

-- CreateIndex
CREATE INDEX "ProductPromotionRequest_productName_idx" ON "ProductPromotionRequest"("productName");

-- CreateIndex
CREATE INDEX "EducationalArticle_userId_idx" ON "EducationalArticle"("userId");

-- CreateIndex
CREATE INDEX "EducationalArticle_topic_idx" ON "EducationalArticle"("topic");

-- CreateIndex
CREATE INDEX "ArticleRating_articleId_idx" ON "ArticleRating"("articleId");

-- CreateIndex
CREATE INDEX "ArticleRating_userId_idx" ON "ArticleRating"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ArticleRating_userId_articleId_key" ON "ArticleRating"("userId", "articleId");

-- CreateIndex
CREATE UNIQUE INDEX "_ProfileBadges_AB_unique" ON "_ProfileBadges"("A", "B");

-- CreateIndex
CREATE INDEX "_ProfileBadges_B_index" ON "_ProfileBadges"("B");
