CREATE TABLE `audit_log` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`action` varchar(128) NOT NULL,
	`target` varchar(256),
	`metadata` json,
	`ipAddress` varchar(64),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `audit_log_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `role` enum('viewer','user','admin') NOT NULL DEFAULT 'user';--> statement-breakpoint
ALTER TABLE `metrics` ADD `dataConfidence` enum('real','estimated','default') DEFAULT 'estimated';--> statement-breakpoint
ALTER TABLE `scrape_jobs` ADD `triggeredBy` int;--> statement-breakpoint
ALTER TABLE `users` ADD `isActive` boolean DEFAULT true NOT NULL;--> statement-breakpoint
CREATE INDEX `idx_audit_user` ON `audit_log` (`userId`);--> statement-breakpoint
CREATE INDEX `idx_audit_action` ON `audit_log` (`action`);--> statement-breakpoint
CREATE INDEX `idx_audit_created` ON `audit_log` (`createdAt`);