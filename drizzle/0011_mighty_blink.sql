CREATE TABLE `drip_emails` (
	`id` int AUTO_INCREMENT NOT NULL,
	`financing_request_id` int NOT NULL,
	`email_type` varchar(50) NOT NULL,
	`recipient_email` varchar(320) NOT NULL,
	`recipient_name` varchar(255),
	`subject` varchar(500),
	`body` text,
	`scheduled_at` timestamp NOT NULL,
	`sent_at` timestamp,
	`status` enum('pending','sent','failed','cancelled') NOT NULL DEFAULT 'pending',
	`error_message` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `drip_emails_id` PRIMARY KEY(`id`)
);
