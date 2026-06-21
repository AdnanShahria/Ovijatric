ALTER TABLE `gallery` ADD `user_id` text REFERENCES users(id);--> statement-breakpoint
ALTER TABLE `gallery` ADD `status` text DEFAULT 'approved' NOT NULL;--> statement-breakpoint
ALTER TABLE `registrations` ADD `user_id` text REFERENCES users(id);