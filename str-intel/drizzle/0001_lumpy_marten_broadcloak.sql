CREATE TABLE `competitors` (
	`id` int AUTO_INCREMENT NOT NULL,
	`hostId` varchar(128) NOT NULL,
	`hostName` varchar(256),
	`otaSourceId` int,
	`portfolioSize` int DEFAULT 0,
	`avgRating` decimal(3,2),
	`avgNightlyRate` decimal(10,2),
	`totalReviews` int DEFAULT 0,
	`neighborhoods` json,
	`propertyTypes` json,
	`isSuperhost` boolean DEFAULT false,
	`firstDetected` timestamp NOT NULL DEFAULT (now()),
	`lastUpdated` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `competitors_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `listings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`externalId` varchar(128) NOT NULL,
	`otaSourceId` int NOT NULL,
	`neighborhoodId` int,
	`title` text,
	`url` varchar(512),
	`propertyType` enum('studio','1br','2br','3br','4br_plus') DEFAULT '1br',
	`hostType` enum('individual','property_manager') DEFAULT 'individual',
	`hostName` varchar(256),
	`hostId` varchar(128),
	`bedrooms` int,
	`bathrooms` int,
	`maxGuests` int,
	`latitude` decimal(10,7),
	`longitude` decimal(10,7),
	`rating` decimal(3,2),
	`reviewCount` int DEFAULT 0,
	`photoCount` int DEFAULT 0,
	`amenities` json,
	`isSuperhost` boolean DEFAULT false,
	`responseRate` int,
	`instantBook` boolean DEFAULT false,
	`firstSeen` timestamp NOT NULL DEFAULT (now()),
	`lastSeen` timestamp NOT NULL DEFAULT (now()),
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `listings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `metrics` (
	`id` int AUTO_INCREMENT NOT NULL,
	`neighborhoodId` int NOT NULL,
	`propertyType` enum('studio','1br','2br','3br','4br_plus','all') DEFAULT 'all',
	`metricDate` timestamp NOT NULL,
	`period` enum('daily','weekly','monthly') DEFAULT 'daily',
	`adr` decimal(10,2),
	`adr30` decimal(10,2),
	`adr60` decimal(10,2),
	`adr90` decimal(10,2),
	`occupancyRate` decimal(5,2),
	`revpar` decimal(10,2),
	`totalListings` int DEFAULT 0,
	`newListings` int DEFAULT 0,
	`avgRating` decimal(3,2),
	`medianPrice` decimal(10,2),
	`priceP25` decimal(10,2),
	`priceP75` decimal(10,2),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `metrics_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `neighborhoods` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(128) NOT NULL,
	`nameAr` varchar(128),
	`slug` varchar(128) NOT NULL,
	`city` varchar(64) NOT NULL DEFAULT 'Riyadh',
	`latitude` decimal(10,7),
	`longitude` decimal(10,7),
	`boundingBox` json,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `neighborhoods_id` PRIMARY KEY(`id`),
	CONSTRAINT `neighborhoods_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `ota_sources` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(64) NOT NULL,
	`slug` varchar(64) NOT NULL,
	`baseUrl` varchar(256),
	`isActive` boolean NOT NULL DEFAULT true,
	`scraperConfig` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `ota_sources_id` PRIMARY KEY(`id`),
	CONSTRAINT `ota_sources_name_unique` UNIQUE(`name`),
	CONSTRAINT `ota_sources_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `price_snapshots` (
	`id` int AUTO_INCREMENT NOT NULL,
	`listingId` int NOT NULL,
	`snapshotDate` timestamp NOT NULL,
	`nightlyRate` decimal(10,2),
	`weeklyRate` decimal(10,2),
	`monthlyRate` decimal(10,2),
	`cleaningFee` decimal(10,2),
	`currency` varchar(8) DEFAULT 'SAR',
	`availableDays` int,
	`blockedDays` int,
	`bookedDays` int,
	`scrapeJobId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `price_snapshots_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `reports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(256) NOT NULL,
	`reportType` enum('weekly','biweekly','monthly','custom') DEFAULT 'weekly',
	`periodStart` timestamp,
	`periodEnd` timestamp,
	`summary` text,
	`data` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `reports_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `scrape_jobs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`otaSourceId` int,
	`neighborhoodId` int,
	`status` enum('pending','running','completed','failed','cancelled') DEFAULT 'pending',
	`jobType` enum('full_scan','price_update','calendar_check','review_scan') DEFAULT 'full_scan',
	`listingsFound` int DEFAULT 0,
	`listingsUpdated` int DEFAULT 0,
	`priceSnapshots` int DEFAULT 0,
	`errors` int DEFAULT 0,
	`errorLog` text,
	`startedAt` timestamp,
	`completedAt` timestamp,
	`duration` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `scrape_jobs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `scrape_schedules` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(128) NOT NULL,
	`otaSourceId` int,
	`neighborhoodId` int,
	`frequency` enum('daily','weekly','biweekly','monthly') DEFAULT 'weekly',
	`jobType` enum('full_scan','price_update','calendar_check','review_scan') DEFAULT 'full_scan',
	`isActive` boolean NOT NULL DEFAULT true,
	`lastRunAt` timestamp,
	`nextRunAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `scrape_schedules_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `seasonal_patterns` (
	`id` int AUTO_INCREMENT NOT NULL,
	`neighborhoodId` int,
	`seasonType` enum('peak','high','low','event') NOT NULL,
	`name` varchar(128) NOT NULL,
	`startDate` varchar(10),
	`endDate` varchar(10),
	`avgPriceMultiplier` decimal(4,2),
	`description` text,
	`year` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `seasonal_patterns_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `idx_competitors_host` ON `competitors` (`hostId`);--> statement-breakpoint
CREATE INDEX `idx_competitors_portfolio` ON `competitors` (`portfolioSize`);--> statement-breakpoint
CREATE INDEX `idx_listings_ota` ON `listings` (`otaSourceId`);--> statement-breakpoint
CREATE INDEX `idx_listings_neighborhood` ON `listings` (`neighborhoodId`);--> statement-breakpoint
CREATE INDEX `idx_listings_external` ON `listings` (`externalId`,`otaSourceId`);--> statement-breakpoint
CREATE INDEX `idx_listings_host` ON `listings` (`hostId`);--> statement-breakpoint
CREATE INDEX `idx_listings_property_type` ON `listings` (`propertyType`);--> statement-breakpoint
CREATE INDEX `idx_metrics_neighborhood` ON `metrics` (`neighborhoodId`);--> statement-breakpoint
CREATE INDEX `idx_metrics_date` ON `metrics` (`metricDate`);--> statement-breakpoint
CREATE INDEX `idx_metrics_type` ON `metrics` (`propertyType`);--> statement-breakpoint
CREATE INDEX `idx_price_listing` ON `price_snapshots` (`listingId`);--> statement-breakpoint
CREATE INDEX `idx_price_date` ON `price_snapshots` (`snapshotDate`);--> statement-breakpoint
CREATE INDEX `idx_price_job` ON `price_snapshots` (`scrapeJobId`);--> statement-breakpoint
CREATE INDEX `idx_jobs_status` ON `scrape_jobs` (`status`);--> statement-breakpoint
CREATE INDEX `idx_jobs_ota` ON `scrape_jobs` (`otaSourceId`);