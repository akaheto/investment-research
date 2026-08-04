/**
 * D4 Macro regime dial — contextualizes equity/crypto scores with yield curve, credit spreads, and real yields.
 * TODO: Connect to FRED API for real-time data.
 */

interface RegimeDilalProps {
  yieldCurveSlope?: number;
  creditSpread?: number;
  realYield10y?: number;
  regime?: "risk-on" | "risk-off" | "neutral";
  className?: string;
}

export function RegimeDial({
  yieldCurveSlope = 45,
  creditSpread = 350,
  realYield10y = 200,
  regime,
  className = "",
}: RegimeDilalProps) {
  // Infer regime if not provided
  const inferredRegime =
    regime ||
    (yieldCurveSlope < 0
      ? "risk-off"
      : creditSpread > 600
        ? "risk-off"
        : yieldCurveSlope > 100 && creditSpread < 300
          ? "risk-on"
          : "neutral");

  const regimeColor =
    inferredRegime === "risk-on"
      ? "text-gain"
      : inferredRegime === "risk-off"
        ? "text-loss"
        : "text-muted";

  const regimeBg =
    inferredRegime === "risk-on"
      ? "bg-gain/5"
      : inferredRegime === "risk-off"
        ? "bg-loss/5"
        : "bg-surface";

  return (
    <div className={`rounded-lg border border-hairline ${regimeBg} p-4 ${className}`}>
      <div className="mb-4">
        <div className="flex items-baseline justify-between mb-2">
          <span className="text-xs text-muted uppercase tracking-wide">Macro Regime</span>
          <span className={`text-lg font-semibold ${regimeColor}`}>
            {inferredRegime === "risk-on" ? "↑ Risk On" : inferredRegime === "risk-off" ? "↓ Risk Off" : "⟷ Neutral"}
          </span>
        </div>
        <div className="text-xs text-muted">
          {inferredRegime === "risk-on" && "Favorable conditions — momentum signals more reliable."}
          {inferredRegime === "risk-off" && "Caution — watch credit spreads and yields closely."}
          {inferredRegime === "neutral" && "Mixed signals — equal weight to diversification."}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div className="border-t border-hairline pt-3">
          <div className="text-xs text-muted mb-1">Yield Curve</div>
          <div className="text-sm font-semibold text-ink">{yieldCurveSlope}bps</div>
          <div className="text-xs text-muted mt-1">
            {yieldCurveSlope < 0 ? "Inverted" : yieldCurveSlope > 100 ? "Steep" : "Flat"}
          </div>
        </div>

        <div className="border-t border-hairline pt-3">
          <div className="text-xs text-muted mb-1">Credit Spreads</div>
          <div className="text-sm font-semibold text-ink">{creditSpread}bps</div>
          <div className="text-xs text-muted mt-1">
            {creditSpread > 600 ? "Wide" : creditSpread < 300 ? "Tight" : "Normal"}
          </div>
        </div>

        <div className="border-t border-hairline pt-3">
          <div className="text-xs text-muted mb-1">Real 10Y Yield</div>
          <div className="text-sm font-semibold text-ink">{realYield10y}bps</div>
          <div className="text-xs text-muted mt-1">
            {realYield10y > 300 ? "High" : realYield10y < 0 ? "Negative" : "Moderate"}
          </div>
        </div>
      </div>
    </div>
  );
}
