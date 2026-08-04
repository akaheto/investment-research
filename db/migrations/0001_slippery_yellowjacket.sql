CREATE TABLE `api_calls` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`timestamp` text NOT NULL,
	`provider` text NOT NULL,
	`endpoint` text NOT NULL,
	`method` text DEFAULT 'GET' NOT NULL,
	`status_code` integer,
	`duration_ms` integer,
	`records_returned` integer,
	`error` text
);
--> statement-breakpoint
CREATE INDEX `ix_api_calls_timestamp` ON `api_calls` (`timestamp`);--> statement-breakpoint
CREATE INDEX `ix_api_calls_provider` ON `api_calls` (`provider`);--> statement-breakpoint
CREATE TABLE `audit_events` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`timestamp` text NOT NULL,
	`event_type` text NOT NULL,
	`user_id` text,
	`action` text NOT NULL,
	`details` text,
	`status` text DEFAULT 'success' NOT NULL
);
--> statement-breakpoint
CREATE INDEX `ix_events_timestamp` ON `audit_events` (`timestamp`);--> statement-breakpoint
CREATE INDEX `ix_events_type` ON `audit_events` (`event_type`);--> statement-breakpoint
CREATE TABLE `file_imports` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`timestamp` text NOT NULL,
	`import_type` text NOT NULL,
	`filename` text NOT NULL,
	`status` text NOT NULL,
	`records_processed` integer,
	`records_failed` integer DEFAULT 0,
	`error` text
);
--> statement-breakpoint
CREATE INDEX `ix_imports_timestamp` ON `file_imports` (`timestamp`);--> statement-breakpoint
CREATE INDEX `ix_imports_type` ON `file_imports` (`import_type`);