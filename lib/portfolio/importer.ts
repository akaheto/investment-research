/**
 * G2: Portfolio import — accounts and holdings from Transamerica PDFs.
 * TODO: Parse PDF table data or accept CSV/manual entry; store as holdings snapshots.
 */

export interface ImportedAccount {
  name: string;
  taxType: "401k" | "ira" | "taxable";
  totalBalance: number;
  asOf: string;
}

export interface ImportedHolding {
  fundName: string;
  assetClassSlot: string;
  balance: number;
  allocation: number;
  expenseRatio?: number;
}

// Account 1: $807,659.75 as of 2026-08-04
export const ACCOUNT_1: ImportedAccount = {
  name: "Transamerica Account 1 (401k)",
  taxType: "401k",
  totalBalance: 807659.75,
  asOf: "2026-08-04",
};

export const HOLDINGS_1: ImportedHolding[] = [
  // Bonds
  { fundName: "Vanguard Total Bond Market Index I", assetClassSlot: "bond_core", balance: 73841.19, allocation: 9 },
  // Large-Cap
  { fundName: "Dodge & Cox Stock X", assetClassSlot: "us_large_cap", balance: 120546.84, allocation: 15 },
  { fundName: "Fidelity 500 Index Institutional Prem", assetClassSlot: "us_large_cap", balance: 286212.69, allocation: 36 },
  // Small/Mid-Cap
  { fundName: "Fidelity Extended Market Index", assetClassSlot: "us_small_mid_cap", balance: 82203.59, allocation: 10 },
  { fundName: "Principal Global Real Estate Sec Inst", assetClassSlot: "real_estate", balance: 40785.55, allocation: 5 },
  // International
  { fundName: "Fidelity International Index", assetClassSlot: "intl_developed", balance: 204069.89, allocation: 25 },
];

// Account 2: $81,585.19 as of 2026-08-04
export const ACCOUNT_2: ImportedAccount = {
  name: "Transamerica Account 2 (IRA)",
  taxType: "ira",
  totalBalance: 81585.19,
  asOf: "2026-08-04",
};

export const HOLDINGS_2: ImportedHolding[] = [
  // Large-Cap
  { fundName: "Dodge & Cox Stock X", assetClassSlot: "us_large_cap", balance: 19779.08, allocation: 24 },
  { fundName: "Fidelity 500 Index Institutional Prem", assetClassSlot: "us_large_cap", balance: 33366.69, allocation: 41 },
  { fundName: "NYLI Winslow Large Cap Growth R6", assetClassSlot: "us_large_cap", balance: 15278.76, allocation: 19 },
  // Real Estate
  { fundName: "Principal Global Real Estate Sec Inst", assetClassSlot: "real_estate", balance: 6647.79, allocation: 8 },
  // International
  { fundName: "Fidelity International Index", assetClassSlot: "intl_developed", balance: 6512.87, allocation: 8 },
];

// Plan menu (all available funds across both accounts)
export const PLAN_MENU_FUNDS: Array<{ name: string; slot: string; expenseRatio?: number }> = [
  { name: "Vanguard Federal Money Market Inv", slot: "cash", expenseRatio: 0.0016 },
  { name: "TCW MetWest Total Return Bond P", slot: "bond_core", expenseRatio: 0.0052 },
  { name: "Vanguard Total Bond Market Index I", slot: "bond_core", expenseRatio: 0.0005 },
  { name: "Dodge & Cox Stock X", slot: "us_large_cap", expenseRatio: 0.0052 },
  { name: "Fidelity 500 Index Institutional Prem", slot: "us_large_cap", expenseRatio: 0.0003 },
  { name: "NYLI Winslow Large Cap Growth R6", slot: "us_large_cap", expenseRatio: 0.0035 },
  { name: "Fidelity Extended Market Index", slot: "us_small_mid_cap", expenseRatio: 0.0002 },
  { name: "DFA US Small Cap I", slot: "us_small_mid_cap", expenseRatio: 0.0040 },
  { name: "William Blair Small-Mid Cap Core R6", slot: "us_small_mid_cap", expenseRatio: 0.0051 },
  { name: "Principal Global Real Estate Sec Inst", slot: "real_estate", expenseRatio: 0.0058 },
  { name: "Fidelity International Discovery", slot: "intl_developed", expenseRatio: 0.0075 },
  { name: "Fidelity International Index", slot: "intl_developed", expenseRatio: 0.0012 },
];
