CREATE TABLE `customer_favorites` (
	`id` int AUTO_INCREMENT NOT NULL,
	`customerId` int NOT NULL,
	`favoritePropertyId` int NOT NULL,
	`addedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `customer_favorites_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `customer_sessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sessionCustomerId` int NOT NULL,
	`customerTokenHash` varchar(255) NOT NULL,
	`customerDeviceInfo` varchar(500),
	`customerIpAddress` varchar(45),
	`customerSessionExpiresAt` timestamp NOT NULL,
	`customerSessionRevoked` boolean NOT NULL DEFAULT false,
	`customerSessionCreatedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `customer_sessions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `customers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`phone` varchar(20) NOT NULL,
	`email` varchar(320),
	`customerName` varchar(255),
	`customerPasswordHash` varchar(255),
	`isVerified` boolean NOT NULL DEFAULT false,
	`customerAvatar` varchar(1000),
	`preferredLanguage` enum('ar','en') NOT NULL DEFAULT 'ar',
	`customerStatus` enum('active','inactive','banned') NOT NULL DEFAULT 'active',
	`lastLoginAt` timestamp,
	`customerCreatedAt` timestamp NOT NULL DEFAULT (now()),
	`customerUpdatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `customers_id` PRIMARY KEY(`id`),
	CONSTRAINT `customers_phone_unique` UNIQUE(`phone`)
);
--> statement-breakpoint
CREATE TABLE `otp_codes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`otpPhone` varchar(20) NOT NULL,
	`otpCode` varchar(10) NOT NULL,
	`otpPurpose` enum('register','login','reset_password') NOT NULL DEFAULT 'register',
	`isUsed` boolean NOT NULL DEFAULT false,
	`otpExpiresAt` timestamp NOT NULL,
	`otpCreatedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `otp_codes_id` PRIMARY KEY(`id`)
);
