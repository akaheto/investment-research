import { Card, EmptyState } from "@/components/card";
import { PageHeader } from "@/components/page-header";
import { RegimeDial } from "@/components/regime-dial";
import { EventsWidget } from "@/app/components/events-widget";
import { getMarketIndices, getYieldCurve, getTopCrypto, getMacroRegime, type MarketIndex, type YieldPoint, type CryptoQuote } from "./actions";

export const dynamic = "force-dynamic";

export default async function MarketsPage() {
  let indices: MarketIndex[] = [];
  let yieldCurve: YieldPoint[] = [];
  let crypto: CryptoQuote[] = [];
  let regime: { yieldCurveSlope: number; creditSpread: number; realYield10y: number } = { yieldCurveSlope: 0, creditSpread: 350, realYield10y: 0 };

  try {
    const results = await Promise.all([
      getMarketIndices(),
      getYieldCurve(),
      getTopCrypto(),
      getMacroRegime(),
    ]);
    indices = results[0];
    yieldCurve = results[1];
    crypto = results[2];
    regime = results[3];
  } catch (error) {
    console.error("❌ Failed to load market data:", error);
  }
  return (
    <>
      <PageHeader title="Markets" caption="Indices, rates, and the macro regime" />
      <div className="grid grid-cols-12 gap-4">
        <RegimeDial
          className="col-span-12"
          yieldCurveSlope={regime.yieldCurveSlope}
          creditSpread={regime.creditSpread}
          realYield10y={regime.realYield10y}
        />
        <Card title="Equity Indices" className="col-span-12 lg:col-span-6">
          {indices.length > 0 ? (
            <div className="space-y-3">
              {indices.map((idx) => (
                <div
                  key={idx.symbol}
                  className="flex items-baseline justify-between py-2 border-b border-hairline last:border-b-0"
                >
                  <div>
                    <div className="font-mono text-sm font-semibold text-ink">{idx.symbol}</div>
                    <div className="text-xs text-muted">{idx.name}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-ink">${idx.price.toFixed(2)}</div>
                    <div className={`text-xs ${idx.change >= 0 ? "text-gain" : "text-loss"}`}>
                      {idx.change >= 0 ? "+" : ""}{idx.change.toFixed(2)} ({idx.changePercent >= 0 ? "+" : ""}
                      {idx.changePercent.toFixed(2)}%)
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState>No market data available yet</EmptyState>
          )}
        </Card>
        <Card title="Yield Curve" className="col-span-12 lg:col-span-6">
          {yieldCurve.length > 0 ? (
            <div className="grid grid-cols-4 gap-3">
              {yieldCurve.map((y) => (
                <div key={y.tenor} className="border border-hairline rounded p-3 text-center">
                  <div className="text-xs text-muted mb-1">{y.tenor}</div>
                  <div className="text-lg font-semibold text-ink">{y.yield.toFixed(2)}%</div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState>No yield curve data available yet</EmptyState>
          )}
        </Card>
        <Card title="Crypto" className="col-span-12">
          {crypto.length > 0 ? (
            <div className="grid grid-cols-3 gap-4">
              {crypto.map((c) => (
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
          ) : (
            <EmptyState>No crypto data available yet</EmptyState>
          )}
        </Card>
        <EventsWidget />
      </div>
    </>
  );
}
