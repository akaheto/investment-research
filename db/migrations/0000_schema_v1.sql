CREATE TABLE `accounts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`institution` text DEFAULT 'Transamerica' NOT NULL,
	`tax_type` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `assessments` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`account_id` integer NOT NULL,
	`run_at` text NOT NULL,
	`deterministic_json` text NOT NULL,
	`narrative_text` text,
	`cited_event_ids_csv` text,
	`model_id` text,
	FOREIGN KEY (`account_id`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `factor_scores` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`instrument_id` integer NOT NULL,
	`run_at` text NOT NULL,
	`factor` text NOT NULL,
	`raw_score` real,
	`percentile` real NOT NULL,
	`weights_preset_id` text DEFAULT 'balanced' NOT NULL,
	`confidence` text DEFAULT 'full' NOT NULL,
	FOREIGN KEY (`instrument_id`) REFERENCES `instruments`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `ix_scores_instrument_run` ON `factor_scores` (`instrument_id`,`run_at`);--> statement-breakpoint
CREATE TABLE `fundamentals_snapshots` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`instrument_id` integer NOT NULL,
	`as_of` text NOT NULL,
	`metric` text NOT NULL,
	`value` real NOT NULL,
	FOREIGN KEY (`instrument_id`) REFERENCES `instruments`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `uq_fundamentals` ON `fundamentals_snapshots` (`instrument_id`,`metric`,`as_of`);--> statement-breakpoint
CREATE TABLE `holdings` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`account_id` integer NOT NULL,
	`plan_fund_id` integer NOT NULL,
	`units` real,
	`balance` real NOT NULL,
	`as_of` text NOT NULL,
	`source` text NOT NULL,
	FOREIGN KEY (`account_id`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`plan_fund_id`) REFERENCES `plan_menu`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `uq_holding_snapshot` ON `holdings` (`account_id`,`plan_fund_id`,`as_of`);--> statement-breakpoint
CREATE TABLE `instruments` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`symbol` text NOT NULL,
	`name` text NOT NULL,
	`asset_class` text NOT NULL,
	`sector` text,
	`currency` text DEFAULT 'USD' NOT NULL,
	`active` integer DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `uq_instruments_symbol_class` ON `instruments` (`symbol`,`asset_class`);--> statement-breakpoint
CREATE TABLE `macro_series` (
	`series_id` text NOT NULL,
	`date` text NOT NULL,
	`value` real NOT NULL,
	PRIMARY KEY(`series_id`, `date`)
);
--> statement-breakpoint
CREATE TABLE `news_items` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`published_at` text NOT NULL,
	`source` text NOT NULL,
	`title` text NOT NULL,
	`url` text NOT NULL,
	`tickers_csv` text,
	`dedupe_hash` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `uq_news_dedupe` ON `news_items` (`dedupe_hash`);--> statement-breakpoint
CREATE TABLE `plan_menu` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`account_id` integer NOT NULL,
	`fund_name` text NOT NULL,
	`asset_class_slot` text NOT NULL,
	`expense_ratio` real,
	`active` integer DEFAULT true NOT NULL,
	FOREIGN KEY (`account_id`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `uq_plan_fund` ON `plan_menu` (`account_id`,`fund_name`);--> statement-breakpoint
CREATE TABLE `prices_daily` (
	`instrument_id` integer NOT NULL,
	`date` text NOT NULL,
	`open` real,
	`high` real,
	`low` real,
	`close` real NOT NULL,
	`volume` real,
	PRIMARY KEY(`instrument_id`, `date`),
	FOREIGN KEY (`instrument_id`) REFERENCES `instruments`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `provider_cache` (
	`cache_key` text PRIMARY KEY NOT NULL,
	`fetched_at` integer NOT NULL,
	`ttl_seconds` integer NOT NULL,
	`payload_json` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `proxy_map` (
	`plan_fund_id` integer PRIMARY KEY NOT NULL,
	`instrument_id` integer NOT NULL,
	`mapping_note` text,
	`confidence` text NOT NULL,
	FOREIGN KEY (`plan_fund_id`) REFERENCES `plan_menu`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`instrument_id`) REFERENCES `instruments`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `watchlist` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`instrument_id` integer NOT NULL,
	`added_at` text NOT NULL,
	`note` text,
	`target_price` real,
	FOREIGN KEY (`instrument_id`) REFERENCES `instruments`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `watchlist_instrument_id_unique` ON `watchlist` (`instrument_id`);