CREATE TABLE `audit_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`userName` varchar(255),
	`auditAction` enum('create','update','delete','login','logout','status_change','export','upload','view','settings_change') NOT NULL,
	`entityType` varchar(100) NOT NULL,
	`entityId` int,
	`oldValues` json,
	`newValues` json,
	`details` json,
	`ipAddress` varchar(45),
	`userAgent` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `audit_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `guides` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(500) NOT NULL,
	`guideSlug` varchar(255) NOT NULL,
	`content` text NOT NULL,
	`category` varchar(100),
	`targetPage` varchar(255),
	`displayOrder` int DEFAULT 0,
	`isPublished` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `guides_id` PRIMARY KEY(`id`),
	CONSTRAINT `guides_guideSlug_unique` UNIQUE(`guideSlug`)
);
--> statement-breakpoint
CREATE TABLE `homepage_sections` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sectionKey` varchar(100) NOT NULL,
	`title` varchar(500),
	`subtitle` varchar(500),
	`content` json,
	`isVisible` boolean DEFAULT true,
	`displayOrder` int DEFAULT 0,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`updatedBy` int,
	CONSTRAINT `homepage_sections_id` PRIMARY KEY(`id`),
	CONSTRAINT `homepage_sections_sectionKey_unique` UNIQUE(`sectionKey`)
);
--> statement-breakpoint
CREATE TABLE `inquiries` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`email` varchar(320),
	`phone` varchar(20),
	`inquiryType` enum('buy','rent','sell','general','management') NOT NULL DEFAULT 'general',
	`message` text,
	`propertyId` int,
	`inquiryStatus` enum('new','in_progress','completed','closed') NOT NULL DEFAULT 'new',
	`assignedTo` int,
	`internalNotes` text,
	`source` varchar(100),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `inquiries_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `media` (
	`id` int AUTO_INCREMENT NOT NULL,
	`filename` varchar(500) NOT NULL,
	`filePath` varchar(1000) NOT NULL,
	`fileType` enum('image','video','document','other') NOT NULL DEFAULT 'image',
	`fileSize` bigint,
	`mimeType` varchar(100),
	`altText` varchar(500),
	`folder` varchar(255) DEFAULT 'general',
	`thumbnailUrl` varchar(1000),
	`uploadedBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `media_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `messages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`threadId` varchar(64) NOT NULL,
	`senderId` int NOT NULL,
	`senderName` varchar(255),
	`recipientId` int NOT NULL,
	`recipientName` varchar(255),
	`subject` varchar(500),
	`body` text NOT NULL,
	`isRead` boolean NOT NULL DEFAULT false,
	`isStarred` boolean NOT NULL DEFAULT false,
	`isArchived` boolean NOT NULL DEFAULT false,
	`parentId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `messages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`title` varchar(500) NOT NULL,
	`message` text,
	`notificationType` enum('inquiry','system','user_action','property','project','message') NOT NULL DEFAULT 'system',
	`isRead` boolean NOT NULL DEFAULT false,
	`link` varchar(1000),
	`metadata` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `pages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(500) NOT NULL,
	`titleEn` varchar(500),
	`slug` varchar(255) NOT NULL,
	`content` text,
	`contentEn` text,
	`sections` json,
	`pageType` enum('static','dynamic','landing') NOT NULL DEFAULT 'static',
	`pageStatus` enum('published','draft','archived') NOT NULL DEFAULT 'published',
	`seoTitle` varchar(500),
	`seoDescription` text,
	`seoKeywords` varchar(500),
	`ogImage` varchar(1000),
	`template` varchar(100) DEFAULT 'default',
	`createdBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `pages_id` PRIMARY KEY(`id`),
	CONSTRAINT `pages_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `permissions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`permRole` enum('admin','manager','staff') NOT NULL,
	`module` varchar(100) NOT NULL,
	`canView` boolean NOT NULL DEFAULT false,
	`canCreate` boolean NOT NULL DEFAULT false,
	`canEdit` boolean NOT NULL DEFAULT false,
	`canDelete` boolean NOT NULL DEFAULT false,
	`canExport` boolean NOT NULL DEFAULT false,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `permissions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `projects` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(500) NOT NULL,
	`titleEn` varchar(500),
	`subtitle` varchar(500),
	`subtitleEn` varchar(500),
	`description` text,
	`descriptionEn` text,
	`location` varchar(500),
	`locationEn` varchar(500),
	`projectStatus` enum('active','completed','upcoming') NOT NULL DEFAULT 'active',
	`totalUnits` int,
	`soldUnits` int,
	`features` json,
	`images` json,
	`videoUrl` varchar(1000),
	`latitude` decimal(10,7),
	`longitude` decimal(10,7),
	`displayOrder` int DEFAULT 0,
	`isFeatured` boolean DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `projects_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `properties` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(500) NOT NULL,
	`titleEn` varchar(500),
	`description` text,
	`descriptionEn` text,
	`propertyType` enum('villa','apartment','land','commercial','office','building') NOT NULL DEFAULT 'villa',
	`listingType` enum('sale','rent') NOT NULL DEFAULT 'sale',
	`propertyStatus` enum('active','sold','rented','draft') NOT NULL DEFAULT 'active',
	`price` decimal(15,2),
	`area` decimal(10,2),
	`rooms` int,
	`bathrooms` int,
	`hasParking` boolean DEFAULT false,
	`city` varchar(100) DEFAULT 'الرياض',
	`cityEn` varchar(100),
	`district` varchar(200),
	`districtEn` varchar(200),
	`address` text,
	`addressEn` text,
	`features` json,
	`images` json,
	`videoUrl` varchar(1000),
	`createdBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`deletedAt` timestamp,
	CONSTRAINT `properties_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `settings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`settingKey` varchar(100) NOT NULL,
	`settingValue` text,
	`groupName` varchar(100),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`updatedBy` int,
	CONSTRAINT `settings_id` PRIMARY KEY(`id`),
	CONSTRAINT `settings_settingKey_unique` UNIQUE(`settingKey`)
);
--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `role` enum('user','admin','manager','staff') NOT NULL DEFAULT 'user';--> statement-breakpoint
ALTER TABLE `users` ADD `username` varchar(100);--> statement-breakpoint
ALTER TABLE `users` ADD `passwordHash` varchar(255);--> statement-breakpoint
ALTER TABLE `users` ADD `displayName` varchar(255);--> statement-breakpoint
ALTER TABLE `users` ADD `fullName` varchar(255);--> statement-breakpoint
ALTER TABLE `users` ADD `phone` varchar(20);--> statement-breakpoint
ALTER TABLE `users` ADD `avatar` varchar(1000);--> statement-breakpoint
ALTER TABLE `users` ADD `userStatus` enum('active','inactive') DEFAULT 'active' NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `failedLoginAttempts` int DEFAULT 0;--> statement-breakpoint
ALTER TABLE `users` ADD `lockedUntil` timestamp;--> statement-breakpoint
ALTER TABLE `users` ADD CONSTRAINT `users_username_unique` UNIQUE(`username`);