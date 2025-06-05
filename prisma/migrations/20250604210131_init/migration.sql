-- CreateEnum
CREATE TYPE "UserType" AS ENUM ('INDIVIDUAL', 'SCHOOL', 'COMMUNITY', 'GOVERNMENT');

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('USER', 'ADMIN');

-- CreateEnum
CREATE TYPE "GroupType" AS ENUM ('SCHOOL', 'COMMUNITY', 'GOVERNMENT', 'OTHER');

-- CreateEnum
CREATE TYPE "GroupRole" AS ENUM ('ADMIN', 'MODERATOR', 'MEMBER');

-- CreateEnum
CREATE TYPE "ActivityStatus" AS ENUM ('PENDING_REVIEW', 'REVIEWED');

-- CreateEnum
CREATE TYPE "ActivityType" AS ENUM ('RECYCLING', 'TREE_PLANTING', 'WATER_SAVING', 'COMPOSTING', 'ENERGY_SAVING', 'EDUCATION', 'OTHER');

-- CreateEnum
CREATE TYPE "RewardCategory" AS ENUM ('DISCOUNT', 'WORKSHOP', 'PRODUCT', 'RECOGNITION', 'EXPERIENCE', 'OTHER');

-- CreateEnum
CREATE TYPE "RedemptionStatus" AS ENUM ('PENDING', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "MaterialCategory" AS ENUM ('PLASTIC', 'PAPER', 'GLASS', 'METAL', 'ORGANIC', 'ELECTRONIC', 'HAZARDOUS', 'OTHER');

-- CreateEnum
CREATE TYPE "BusinessType" AS ENUM ('FOOD', 'PRODUCTS', 'SERVICES', 'TECHNOLOGY', 'HEALTH', 'EDUCATION', 'TOURISM', 'OTHER');

-- CreateEnum
CREATE TYPE "BusinessPromotionStatus" AS ENUM ('PENDING_APPROVAL', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "ArticleTopic" AS ENUM ('REDUCCION_RESIDUOS', 'AHORRO_RECURSOS', 'CONSUMO_RESPONSABLE', 'BIODIVERSIDAD', 'HUERTOS_URBANOS', 'MOVILIDAD_SOSTENIBLE', 'CAMBIO_CLIMATICO', 'OTRO');

-- CreateEnum
CREATE TYPE "VisualMaterialTopic" AS ENUM ('INFOGRAFIA', 'VIDEO_TUTORIAL', 'PRESENTACION', 'GALERIA_IMAGENES', 'GUIA_VISUAL_RAPIDA', 'ECO_RETO_VISUAL', 'OTRO');

-- CreateEnum
CREATE TYPE "VideoTopic" AS ENUM ('TUTORIAL_PRACTICO', 'CONSEJO_RAPIDO', 'DEMOSTRACION_PROYECTO', 'ENTREVISTA_EXPERTO', 'ANIMACION_EXPLICATIVA', 'ECO_NOTICIA_BREVE', 'OTRO');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'USER',
    "userType" "UserType" NOT NULL DEFAULT 'INDIVIDUAL',
    "points" INTEGER NOT NULL DEFAULT 0,
    "level" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Profile" (
    "id" TEXT NOT NULL,
    "bio" TEXT,
    "address" TEXT,
    "city" TEXT,
    "state" TEXT,
    "zipCode" TEXT,
    "phone" TEXT,
    "avatarUrl" TEXT,
    "userId" TEXT NOT NULL,

    CONSTRAINT "Profile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Group" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" "GroupType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Group_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GroupMember" (
    "id" TEXT NOT NULL,
    "role" "GroupRole" NOT NULL DEFAULT 'MEMBER',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,

    CONSTRAINT "GroupMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Activity" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "type" "ActivityType" NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "unit" TEXT NOT NULL,
    "points" INTEGER NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "status" "ActivityStatus" NOT NULL DEFAULT 'PENDING_REVIEW',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,
    "groupId" TEXT,

    CONSTRAINT "Activity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Evidence" (
    "id" TEXT NOT NULL,
    "activityId" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "format" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Evidence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Reward" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "pointsCost" INTEGER NOT NULL,
    "available" BOOLEAN NOT NULL DEFAULT true,
    "quantity" INTEGER,
    "expiresAt" TIMESTAMP(3),
    "category" "RewardCategory" NOT NULL DEFAULT 'OTHER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT,

    CONSTRAINT "Reward_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Redemption" (
    "id" TEXT NOT NULL,
    "redeemedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "RedemptionStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "rewardId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "Redemption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Badge" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "criteria" TEXT NOT NULL,

    CONSTRAINT "Badge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecyclingCenter" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "address" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "zipCode" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "website" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "openingHours" TEXT,

    CONSTRAINT "RecyclingCenter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Material" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" "MaterialCategory" NOT NULL,

    CONSTRAINT "Material_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CenterMaterial" (
    "id" TEXT NOT NULL,
    "centerId" TEXT NOT NULL,
    "materialId" TEXT NOT NULL,

    CONSTRAINT "CenterMaterial_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BusinessPromotionRequest" (
    "id" TEXT NOT NULL,
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
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "openingHours" TEXT,
    "socialMedia" TEXT,
    "paymentIntentId" TEXT,
    "paymentStatus" TEXT,
    "amountPaid" DOUBLE PRECISION,
    "currency" TEXT,
    "status" "BusinessPromotionStatus" NOT NULL DEFAULT 'PENDING_APPROVAL',
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),
    "reviewerNotes" TEXT,

    CONSTRAINT "BusinessPromotionRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductImage" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "productPromotionRequestId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductImage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductPromotionRequest" (
    "id" TEXT NOT NULL,
    "businessName" TEXT NOT NULL,
    "productName" TEXT NOT NULL,
    "businessLogoUrl" TEXT,
    "description" TEXT NOT NULL,
    "businessType" TEXT NOT NULL,
    "priceOrPromotion" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "validUntil" TIMESTAMP(3),
    "zipCode" TEXT,
    "phone" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "openingHours" TEXT,
    "contactEmail" TEXT,
    "website" TEXT,
    "socialMediaLinks" TEXT,
    "paymentIntentId" TEXT,
    "paymentStatus" TEXT,
    "amountPaid" DOUBLE PRECISION,
    "currency" TEXT,
    "status" "BusinessPromotionStatus" NOT NULL DEFAULT 'PENDING_APPROVAL',
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),
    "reviewerNotes" TEXT,

    CONSTRAINT "ProductPromotionRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EducationalArticle" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "topic" "ArticleTopic" NOT NULL,
    "authorName" TEXT NOT NULL,
    "authorInstitution" TEXT NOT NULL,
    "authorInfo" TEXT,
    "coverImageUrl" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EducationalArticle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ArticleRating" (
    "id" TEXT NOT NULL,
    "liked" BOOLEAN NOT NULL,
    "articleId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ArticleRating_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VisualMaterial" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "topic" "VisualMaterialTopic" NOT NULL,
    "authorName" TEXT NOT NULL,
    "authorInstitution" TEXT NOT NULL,
    "authorInfo" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VisualMaterial_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VisualMaterialImage" (
    "id" TEXT NOT NULL,
    "s3Key" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "visualMaterialId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VisualMaterialImage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VisualMaterialRating" (
    "id" TEXT NOT NULL,
    "liked" BOOLEAN NOT NULL,
    "visualMaterialId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VisualMaterialRating_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShortVideo" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "videoS3Key" TEXT,
    "externalVideoUrl" TEXT,
    "thumbnailS3Key" TEXT,
    "duration" INTEGER,
    "topic" "VideoTopic" NOT NULL,
    "authorName" TEXT NOT NULL,
    "authorInstitution" TEXT NOT NULL,
    "authorInfo" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShortVideo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShortVideoRating" (
    "id" TEXT NOT NULL,
    "liked" BOOLEAN NOT NULL,
    "shortVideoId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShortVideoRating_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_ProfileBadges" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_ProfileBadges_AB_pkey" PRIMARY KEY ("A","B")
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
CREATE INDEX "VisualMaterial_userId_idx" ON "VisualMaterial"("userId");

-- CreateIndex
CREATE INDEX "VisualMaterial_topic_idx" ON "VisualMaterial"("topic");

-- CreateIndex
CREATE INDEX "VisualMaterialImage_visualMaterialId_idx" ON "VisualMaterialImage"("visualMaterialId");

-- CreateIndex
CREATE INDEX "VisualMaterialRating_visualMaterialId_idx" ON "VisualMaterialRating"("visualMaterialId");

-- CreateIndex
CREATE INDEX "VisualMaterialRating_userId_idx" ON "VisualMaterialRating"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "VisualMaterialRating_userId_visualMaterialId_key" ON "VisualMaterialRating"("userId", "visualMaterialId");

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

-- CreateIndex
CREATE INDEX "_ProfileBadges_B_index" ON "_ProfileBadges"("B");

-- AddForeignKey
ALTER TABLE "Profile" ADD CONSTRAINT "Profile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupMember" ADD CONSTRAINT "GroupMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupMember" ADD CONSTRAINT "GroupMember_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evidence" ADD CONSTRAINT "Evidence_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "Activity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reward" ADD CONSTRAINT "Reward_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Redemption" ADD CONSTRAINT "Redemption_rewardId_fkey" FOREIGN KEY ("rewardId") REFERENCES "Reward"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CenterMaterial" ADD CONSTRAINT "CenterMaterial_centerId_fkey" FOREIGN KEY ("centerId") REFERENCES "RecyclingCenter"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CenterMaterial" ADD CONSTRAINT "CenterMaterial_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "Material"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductImage" ADD CONSTRAINT "ProductImage_productPromotionRequestId_fkey" FOREIGN KEY ("productPromotionRequestId") REFERENCES "ProductPromotionRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EducationalArticle" ADD CONSTRAINT "EducationalArticle_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArticleRating" ADD CONSTRAINT "ArticleRating_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "EducationalArticle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArticleRating" ADD CONSTRAINT "ArticleRating_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VisualMaterial" ADD CONSTRAINT "VisualMaterial_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VisualMaterialImage" ADD CONSTRAINT "VisualMaterialImage_visualMaterialId_fkey" FOREIGN KEY ("visualMaterialId") REFERENCES "VisualMaterial"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VisualMaterialRating" ADD CONSTRAINT "VisualMaterialRating_visualMaterialId_fkey" FOREIGN KEY ("visualMaterialId") REFERENCES "VisualMaterial"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VisualMaterialRating" ADD CONSTRAINT "VisualMaterialRating_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShortVideo" ADD CONSTRAINT "ShortVideo_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShortVideoRating" ADD CONSTRAINT "ShortVideoRating_shortVideoId_fkey" FOREIGN KEY ("shortVideoId") REFERENCES "ShortVideo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShortVideoRating" ADD CONSTRAINT "ShortVideoRating_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ProfileBadges" ADD CONSTRAINT "_ProfileBadges_A_fkey" FOREIGN KEY ("A") REFERENCES "Badge"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ProfileBadges" ADD CONSTRAINT "_ProfileBadges_B_fkey" FOREIGN KEY ("B") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
