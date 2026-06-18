CREATE TABLE `banners` (
	`id` text PRIMARY KEY NOT NULL,
	`image_url` text NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`order_index` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL
);
