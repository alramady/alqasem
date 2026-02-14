CREATE TABLE `newsletter_subscribers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`email` varchar(320) NOT NULL,
	`name` varchar(255),
	`isActive` boolean NOT NULL DEFAULT true,
	`subscribedAt` timestamp NOT NULL DEFAULT (now()),
	`unsubscribedAt` timestamp,
	CONSTRAINT `newsletter_subscribers_id` PRIMARY KEY(`id`),
	CONSTRAINT `newsletter_subscribers_email_unique` UNIQUE(`email`)
);
--> statement-breakpoint
CREATE TABLE `property_views` (
	`id` int AUTO_INCREMENT NOT NULL,
	`propertyId` int NOT NULL,
	`visitorIp` varchar(45),
	`userAgent` text,
	`viewedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `property_views_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `properties` ADD `viewCount` int DEFAULT 0;