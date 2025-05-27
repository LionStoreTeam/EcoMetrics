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
