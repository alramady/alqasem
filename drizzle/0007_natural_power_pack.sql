CREATE TABLE `amenities` (
	`id` int AUTO_INCREMENT NOT NULL,
	`nameAr` varchar(200) NOT NULL,
	`nameEn` varchar(200),
	`icon` varchar(100),
	`amenityCategory` enum('basic','comfort','security','outdoor','entertainment','other') NOT NULL DEFAULT 'basic',
	`isActive` boolean NOT NULL DEFAULT true,
	`sortOrder` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `amenities_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `property_amenities` (
	`id` int AUTO_INCREMENT NOT NULL,
	`propertyId` int NOT NULL,
	`amenityId` int NOT NULL,
	CONSTRAINT `property_amenities_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `properties` ADD `floor` int;--> statement-breakpoint
ALTER TABLE `properties` ADD `direction` enum('north','south','east','west','north_east','north_west','south_east','south_west');--> statement-breakpoint
ALTER TABLE `properties` ADD `furnishing` enum('furnished','semi_furnished','unfurnished');--> statement-breakpoint
ALTER TABLE `properties` ADD `buildingAge` int;