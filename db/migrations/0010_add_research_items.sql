CREATE TABLE `research_items` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title` text NOT NULL,
	`published_at` text NOT NULL,
	`body` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `ix_research_published` ON `research_items` (`published_at`);
