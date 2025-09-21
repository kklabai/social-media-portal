-- CreateTable
CREATE TABLE "User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "ecitizen_id" TEXT,
    "role" TEXT NOT NULL DEFAULT 'user',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Ecosystem" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "theme" TEXT NOT NULL,
    "description" TEXT,
    "active_status" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "UserEcosystem" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "user_id" INTEGER NOT NULL,
    "ecosystem_id" INTEGER NOT NULL,
    "assigned_by" INTEGER,
    "assigned_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "UserEcosystem_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "UserEcosystem_ecosystem_id_fkey" FOREIGN KEY ("ecosystem_id") REFERENCES "Ecosystem" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "UserEcosystem_assigned_by_fkey" FOREIGN KEY ("assigned_by") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SocialMediaPlatform" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "ecosystem_id" INTEGER NOT NULL,
    "platform_name" TEXT NOT NULL,
    "platform_type" TEXT NOT NULL,
    "account_status" TEXT NOT NULL DEFAULT 'active',
    "profile_url" TEXT,
    "profile_id" TEXT,
    "username" TEXT,
    "password" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "recovery_email" TEXT,
    "recovery_phone" TEXT,
    "two_fa_enabled" BOOLEAN NOT NULL DEFAULT false,
    "totp_enabled" BOOLEAN NOT NULL DEFAULT false,
    "totp_secret" TEXT,
    "bio" TEXT,
    "profile_image_url" TEXT,
    "cover_image_url" TEXT,
    "verification_status" TEXT NOT NULL DEFAULT 'unverified',
    "notes" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "last_checked" DATETIME,
    "last_posted" DATETIME,
    "followers_count" INTEGER,
    "following_count" INTEGER,
    "posts_count" INTEGER,
    CONSTRAINT "SocialMediaPlatform_ecosystem_id_fkey" FOREIGN KEY ("ecosystem_id") REFERENCES "Ecosystem" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CredentialHistory" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "platform_id" INTEGER NOT NULL,
    "field_name" TEXT NOT NULL,
    "old_value" TEXT,
    "new_value" TEXT,
    "changed_by" INTEGER NOT NULL,
    "changed_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CredentialHistory_platform_id_fkey" FOREIGN KEY ("platform_id") REFERENCES "SocialMediaPlatform" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CredentialHistory_changed_by_fkey" FOREIGN KEY ("changed_by") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "EmailId" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "platform_id" INTEGER NOT NULL,
    "email" TEXT NOT NULL,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "EmailId_platform_id_fkey" FOREIGN KEY ("platform_id") REFERENCES "SocialMediaPlatform" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PlatformTemplate" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "platform_name" TEXT NOT NULL,
    "platform_category" TEXT NOT NULL,
    "base_url" TEXT,
    "name_format" TEXT,
    "bio_format" TEXT,
    "url_format" TEXT,
    "notes" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Ecosystem_name_key" ON "Ecosystem"("name");

-- CreateIndex
CREATE UNIQUE INDEX "UserEcosystem_user_id_ecosystem_id_key" ON "UserEcosystem"("user_id", "ecosystem_id");

-- CreateIndex
CREATE UNIQUE INDEX "SocialMediaPlatform_ecosystem_id_platform_name_key" ON "SocialMediaPlatform"("ecosystem_id", "platform_name");

-- CreateIndex
CREATE UNIQUE INDEX "PlatformTemplate_platform_name_key" ON "PlatformTemplate"("platform_name");
