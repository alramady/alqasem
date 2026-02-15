ALTER TABLE `properties` ADD `virtualTourUrl` varchar(1000);--> statement-breakpoint
ALTER TABLE `properties` ADD `virtualTourType` enum('matterport','youtube','custom');