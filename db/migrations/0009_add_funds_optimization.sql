-- Epic G: Portfolio Assessment & Optimization

CREATE TABLE IF NOT EXISTS funds (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  fund_name TEXT NOT NULL,
  fund_category TEXT NOT NULL,
  inception_date TEXT,
  unit_share_value REAL,
  expense_ratio_gross REAL,
  expense_ratio_net REAL,
  asset_class_slot TEXT,
  created_at TEXT NOT NULL
);

CREATE INDEX ix_funds_category ON funds(fund_category);
CREATE INDEX ix_funds_assetclass ON funds(asset_class_slot);

CREATE TABLE IF NOT EXISTS fund_performance (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  fund_id INTEGER NOT NULL REFERENCES funds(id),
  as_of TEXT NOT NULL,
  one_month_percent REAL,
  three_months_percent REAL,
  ytd_percent REAL,
  one_year_percent REAL,
  three_years_percent REAL,
  five_years_percent REAL,
  ten_years_percent REAL
);

CREATE INDEX ix_perf_fund ON fund_performance(fund_id);
CREATE INDEX ix_perf_date ON fund_performance(as_of);

CREATE TABLE IF NOT EXISTS fund_holdings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  account_id INTEGER NOT NULL REFERENCES accounts(id),
  fund_id INTEGER NOT NULL REFERENCES funds(id),
  units_owned REAL NOT NULL,
  balance_amount REAL NOT NULL,
  allocation_percent REAL NOT NULL,
  as_of TEXT NOT NULL
);

CREATE INDEX ix_holdings_account ON fund_holdings(account_id);
CREATE INDEX ix_holdings_fund ON fund_holdings(fund_id);

CREATE TABLE IF NOT EXISTS optimization_suggestions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  account_id INTEGER NOT NULL REFERENCES accounts(id),
  current_fund_id INTEGER NOT NULL REFERENCES funds(id),
  suggested_fund_id INTEGER NOT NULL REFERENCES funds(id),
  reason TEXT NOT NULL,
  estimated_annual_savings REAL,
  risk_adjustment TEXT,
  created_at TEXT NOT NULL
);

CREATE INDEX ix_sugg_account ON optimization_suggestions(account_id);
CREATE INDEX ix_sugg_currentfund ON optimization_suggestions(current_fund_id);
