CREATE TABLE `research_limits` (
	`id` text PRIMARY KEY NOT NULL,
	`used` integer NOT NULL,
	`expires` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `research_turns` (
	`id` text PRIMARY KEY NOT NULL,
	`sid` text NOT NULL,
	`payload` text NOT NULL,
	`status` text NOT NULL,
	`expires` integer NOT NULL
);
