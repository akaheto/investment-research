import { Card } from "@/components/card";
import { PageHeader } from "@/components/page-header";
import { RegimeDial } from "@/components/regime-dial";

// TODO C4: Fetch real data from B4 (crypto) and B5 (macro)
const indices = [
  { symbol: "SPY", name: "S&P 500", price: 596.2, change: 2.1, changePercent: 0.35 },
  { symbol: "QQQ", name: "Nasdaq", price: 487.9, change: 5.3, changePercent: 1.10 },
  { symbol: "IWM", name: "Russell 2000", price: 213.4, change: -1.2, changePercent: -0.56 },
];

// TODO C4: Replace with real FRED data (B5)
const yieldCurve = [
  { tenor: "2Y", yield: 4.18 },
  { tenor: "5Y", yield: 4.06 },
  { tenor: "10Y", yield: 4.12 },
  { tenor: "30Y", yield: 4.38 },
];

// TODO C4: Replace with real CoinGecko data (B4)
const cryptoTop = [
  { symbol: "BTC", name: "Bitcoin", price: 42580, change: 3.2, changePercent: 2.31 },
  { symbol: "ETH", name: "Ethereum", price: 2341, change: -1.5, changePercent: -0.60 },
  { symbol: "USDT", name: "Tether", price: 1.0, change: 0, changePercent: 0 },
];

export default function MarketsPage() {
  return (
    <>
      <PageHeader title="Markets" caption="Indices, rates, and the macro regime" />
      <div className="grid grid-cols-12 gap-4">
        <RegimeDial className="col-span-12" yieldCurveSlope={45} creditSpread={350} realYield10y={200} />
        <Card title="Equity Indices" className="col-span-12 lg:col-span-6">
          <div className="space-y-3">
            {indices.map((idx) => (
              <div key={idx.symbol} className="flex items-baseline justify-between py-2 border-b border-hairline last:border-b-0">
                <div>
                  <div className="font-mono text-sm font-semibold text-ink">{idx.symbol}</div>
                  <div className="text-xs text-muted">{idx.name}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-ink">${idx.price.toFixed(2)}</div>
                  <div className={`text-xs ${idx.change >= 0 ? "text-gain" : "text-loss"}`}>
                    {idx.change >= 0 ? "+" : ""}{idx.change.toFixed(2)} ({idx.changePercent >= 0 ? "+" : ""}{idx.changePercent.toFixed(2)}%)
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
        <Card title="Yield Curve" className="col-span-12 lg:col-span-6">
          <div className="grid grid-cols-4 gap-3">
            {yieldCurve.map((y) => (
              <div key={y.tenor} className="border border-hairline rounded p-3 text-center">
                <div className="text-xs text-muted mb-1">{y.tenor}</div>
                <div className="text-lg font-semibold text-ink">{y.yield.toFixed(2)}%</div>
              </div>
            ))}
          </div>
        </Card>
        <Card title="Crypto" className="col-span-12">
          <div className="grid grid-cols-3 gap-4">
            {cryptoTop.map((c) => (
              <div key={c.symbol} className="border-r border-hairline last:border-r-0 pr-4 last:pr-0">
                <div className="font-mono font-semibold text-ink">{c.symbol}</div>
                <div className="text-xs text-muted mb-2">{c.name}</div>
                <div className="text-sm text-ink">${c.price.toLocaleString()}</div>
                <div className={`text-xs ${c.change >= 0 ? "text-gain" : "text-loss"}`}>
                  {c.changePercent >= 0 ? "+" : ""}{c.changePercent.toFixed(2)}%
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </>
  );
}
