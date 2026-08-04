/**
 * G1/G2: Proxy mapping — plan fund names to public tickers for scoring.
 * Maps Transamerica funds to exact or close ticker equivalents.
 * TODO: Fetch fund data from Yahoo/Morningstar to auto-populate; verify confidence levels.
 */

export interface ProxyMapping {
  planFundName: string;
  ticker: string;
  assetClass: string;
  confidence: "exact" | "close" | "loose";
  note: string;
}

export const PROXY_MAPPINGS: ProxyMapping[] = [
  // Bonds
  { planFundName: "Vanguard Total Bond Market Index I", ticker: "BND", assetClass: "etf", confidence: "exact", note: "Vanguard total bond market index fund" },
  { planFundName: "TCW MetWest Total Return Bond P", ticker: "MWTX", assetClass: "etf", confidence: "close", note: "Active bond fund; MWTX is closest comparable" },

  // Large-Cap Stocks
  { planFundName: "Dodge & Cox Stock X", ticker: "DODGX", assetClass: "etf", confidence: "exact", note: "Dodge & Cox stock fund ticker" },
  { planFundName: "Fidelity 500 Index Institutional Prem", ticker: "FXAIX", assetClass: "etf", confidence: "exact", note: "Fidelity S&P 500 index (institutional)" },
  { planFundName: "NYLI Winslow Large Cap Growth R6", ticker: "NYLGX", assetClass: "etf", confidence: "close", note: "NYLI Winslow large-cap growth fund" },

  // Small/Mid-Cap
  { planFundName: "Fidelity Extended Market Index", ticker: "SWTSX", assetClass: "etf", confidence: "exact", note: "Fidelity small-cap/mid-cap market index" },
  { planFundName: "DFA US Small Cap I", ticker: "DFSTX", assetClass: "etf", confidence: "exact", note: "DFA US Small Cap fund" },
  { planFundName: "William Blair Small-Mid Cap Core R6", ticker: "WBSIX", assetClass: "etf", confidence: "close", note: "William Blair small-mid cap fund" },

  // Real Estate
  { planFundName: "Principal Global Real Estate Sec Inst", ticker: "PSP", assetClass: "etf", confidence: "close", note: "Principal Real Estate fund; PSP is comparable REIT ETF" },

  // International
  { planFundName: "Fidelity International Discovery", ticker: "FIIDX", assetClass: "etf", confidence: "close", note: "Fidelity international discovery fund" },
  { planFundName: "Fidelity International Index", ticker: "FTIHX", assetClass: "etf", confidence: "exact", note: "Fidelity international index fund" },
];
