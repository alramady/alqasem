CREATE TABLE `activity_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`userName` varchar(255),
	`activityAction` varchar(100) NOT NULL,
	`activityCategory` enum('auth','property','project','inquiry','cms','media','settings','user','system') NOT NULL DEFAULT 'system',
	`activityEntityType` varchar(100),
	`activityEntityId` int,
	`activityDescription` text,
	`activityMetadata` json,
	`activityIpAddress` varchar(45),
	`activityUserAgent` text,
	`activityCreatedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `activity_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` ADD `totpSecret` varchar(255);--> statement-breakpoint
ALTER TABLE `users` ADD `totpEnabled` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `totpBackupCodes` json;