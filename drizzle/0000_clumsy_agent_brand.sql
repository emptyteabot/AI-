CREATE TABLE `cases` (
	`id` text PRIMARY KEY NOT NULL,
	`data` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `results` (
	`id` text PRIMARY KEY NOT NULL,
	`run_id` text NOT NULL,
	`case_id` text NOT NULL,
	`provider` text NOT NULL,
	`status` text NOT NULL,
	`snapshot` text NOT NULL,
	`data` text,
	`error` text,
	`attempts` integer DEFAULT 0 NOT NULL,
	`lease` text,
	`lease_until` integer,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`run_id`) REFERENCES `runs`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `results_run_idx` ON `results` (`run_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `results_case_provider` ON `results` (`run_id`,`case_id`,`provider`);--> statement-breakpoint
CREATE TABLE `reviews` (
	`id` text PRIMARY KEY NOT NULL,
	`run_id` text NOT NULL,
	`reviewer` text NOT NULL,
	`case_id` text NOT NULL,
	`left_id` text NOT NULL,
	`right_id` text NOT NULL,
	`pair_key` text NOT NULL,
	`vote` text,
	`ratings` text,
	`comment` text,
	`created_at` text NOT NULL,
	`submitted_at` text,
	FOREIGN KEY (`run_id`) REFERENCES `runs`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `reviewer_pair_unique` ON `reviews` (`run_id`,`reviewer`,`pair_key`);--> statement-breakpoint
CREATE TABLE `runs` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`mode` text NOT NULL,
	`status` text NOT NULL,
	`config` text NOT NULL,
	`dataset_hash` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `settings` (
	`id` text PRIMARY KEY NOT NULL,
	`data` text NOT NULL
);
