CREATE TABLE `brokerage_account_summary` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`account_id` integer NOT NULL,
	`as_of` text NOT NULL,
	`net_liquidation` real NOT NULL,
	`cash_balance` real,
	`total_unrealized_pnl` real,
	`buying_power` real,
	`currency` text DEFAULT 'USD' NOT NULL,
	`source` text DEFAULT 'ibkr_api' NOT NULL,
	FOREIGN KEY (`account_id`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `uq_brokerage_summary_snapshot` ON `brokerage_account_summary` (`account_id`,`as_of`);--> statement-breakpoint
CREATE TABLE `brokerage_positions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`account_id` integer NOT NULL,
	`instrument_id` integer,
	`symbol` text NOT NULL,
	`description` text,
	`asset_class` text NOT NULL,
	`quantity` real NOT NULL,
	`avg_cost` real,
	`market_price` real,
	`market_value` real NOT NULL,
	`unrealized_pnl` real,
	`currency` text DEFAULT 'USD' NOT NULL,
	`as_of` text NOT NULL,
	`source` text DEFAULT 'ibkr_api' NOT NULL,
	FOREIGN KEY (`account_id`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`instrument_id`) REFERENCES `instruments`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `uq_brokerage_position_snapshot` ON `brokerage_positions` (`account_id`,`symbol`,`as_of`);--> statement-breakpoint
ALTER TABLE `accounts` ADD `external_id` text;