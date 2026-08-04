import { Card, EmptyState } from "@/components/card";
import { PageHeader } from "@/components/page-header";

/**
 * Oracle — AI-driven investment recommendations.
 * Analyzes stock fundamentals, current events, political implications, and macro trends.
 * Currently a placeholder for future enhancement.
 */

export default function OraclePage() {
  return (
    <>
      <PageHeader title="Oracle" caption="AI-driven investment insights and recommendations" />

      <div className="grid grid-cols-12 gap-4">
        <Card title="Recommendations" className="col-span-12 lg:col-span-8">
          <EmptyState>
            Coming soon — Oracle will analyze fundamentals, news sentiment, and geopolitical events to provide
            investment recommendations tailored to your watchlist and portfolio.
          </EmptyState>
        </Card>

        <Card title="Context" className="col-span-12 lg:col-span-4">
          <div className="space-y-3 text-sm text-muted">
            <div>
              <div className="font-semibold text-ink mb-1">Fundamentals</div>
              <div>PE ratios, growth rates, ROE, cash flow</div>
            </div>
            <div className="border-t border-hairline pt-3">
              <div className="font-semibold text-ink mb-1">News Sentiment</div>
              <div>Current headlines, earnings surprises, guidance</div>
            </div>
            <div className="border-t border-hairline pt-3">
              <div className="font-semibold text-ink mb-1">Macro Trends</div>
              <div>Interest rates, yield curve, political events</div>
            </div>
            <div className="border-t border-hairline pt-3">
              <div className="font-semibold text-ink mb-1">Portfolio Fit</div>
              <div>Correlation, diversification, risk balance</div>
            </div>
          </div>
        </Card>
      </div>
    </>
  );
}
