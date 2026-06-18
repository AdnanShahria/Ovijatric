CREATE TABLE `map_pins` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`lat` real NOT NULL,
	`lng` real NOT NULL,
	`type` text NOT NULL,
	`title` text NOT NULL,
	`details` text,
	`image_url` text,
	`date_text` text,
	`linked_event_id` text,
	`linked_gallery_ids` text,
	`linked_place_slug` text,
	`created_at` integer NOT NULL
);
