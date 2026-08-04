-- Epic E: News, Events & Narratives

CREATE TABLE IF NOT EXISTS events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_date TEXT NOT NULL,
  event_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  instrument_id INTEGER REFERENCES instruments(id),
  impact_direction TEXT,
  source TEXT,
  url TEXT,
  created_at TEXT NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS ix_events_date ON events(event_date);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS ix_events_type ON events(event_type);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS ix_events_instrument ON events(instrument_id);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS news_narratives (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  instrument_id INTEGER NOT NULL REFERENCES instruments(id),
  narrative TEXT NOT NULL,
  recent_headlines TEXT,
  generated_at TEXT NOT NULL,
  expires_at TEXT NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS ix_narratives_instrument ON news_narratives(instrument_id);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS ix_narratives_generated ON news_narratives(generated_at);
