"use client";

import { Card, EmptyState } from "@/components/card";
import { PageHeader } from "@/components/page-header";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { getInstrumentDetail } from "../actions";
import { use, useEffect, useState } from "react";
import type { InstrumentDetail } from "../actions";

export default function InstrumentPage({ params }: { params: Promise<{ symbol: string }> }) {
  const { symbol } = use(params);
  const [detail, setDetail] = useState<InstrumentDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const data = await getInstrumentDetail(symbol);
      setDetail(data);
      setLoading(false);
    }
    load();
  }, [symbol]);

  if (loading) {
    return (
      <>
        <PageHeader title={symbol} caption="Loading..." />
        <Card>
          <div className="py-10 text-center text-sm text-muted">Loading instrument data...</div>
        </Card>
      </>
    );
  }

  if (!detail) {
    return (
      <>
        <PageHeader title={symbol} caption="Price history, fundamentals, and composite score" />
        <Card>
          <EmptyState>Instrument not found. Add {symbol} to your watchlist first.</EmptyState>
        </Card>
      </>
    );
  }

  return (
    <>
      <PageHeader title={detail?.symbol || symbol} caption={detail?.name || ""} />
      <div className="grid grid-cols-12 gap-4">
        <Card title="Price" className="col-span-12 lg:col-span-8 h-80">
          {detail.priceHistory.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={detail.priceHistory} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--hairline)" />
                <XAxis dataKey="date" stroke="var(--muted)" style={{ fontSize: "12px" }} />
                <YAxis stroke="var(--muted)" style={{ fontSize: "12px" }} />
                <Tooltip contentStyle={{ backgroundColor: "var(--surface)", border: "1px solid var(--hairline)" }} />
                <Line type="monotone" dataKey="close" stroke="var(--accent)" dot={{ fill: "var(--accent)", r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-sm text-muted">
              No price history available yet
            </div>
          )}
        </Card>
        <Card title="Score" className="col-span-12 lg:col-span-4">
          {detail.compositeScore !== undefined ? (
            <div className="space-y-3">
              <div className="flex items-baseline justify-between">
                <span className="text-sm text-muted">Composite</span>
                <span className="text-3xl font-semibold text-ink">{Math.round(detail.compositeScore)}</span>
              </div>
              <div className="text-xs text-muted">Balanced preset • High confidence</div>
              <div className="space-y-2 text-xs border-t border-hairline pt-3">
                {detail.factors && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-muted">Valuation</span>
                      <span className="font-semibold">
                        {detail.factors.valuation ? Math.round(detail.factors.valuation) : "–"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted">Growth</span>
                      <span className="font-semibold">
                        {detail.factors.growth ? Math.round(detail.factors.growth) : "–"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted">Quality</span>
                      <span className="font-semibold">
                        {detail.factors.quality ? Math.round(detail.factors.quality) : "–"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted">Momentum</span>
                      <span className="font-semibold">
                        {detail.factors.momentum ? Math.round(detail.factors.momentum) : "–"}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>
          ) : (
            <div className="text-sm text-muted">No scores available yet</div>
          )}
        </Card>
        {detail.fundamentals.length > 0 && (
          <Card title="Fundamentals" className="col-span-12">
            <div className="grid grid-cols-4 gap-4">
              {detail.fundamentals.map((f) => (
                <div key={f.label} className="border-r border-hairline last:border-r-0">
                  <div className="text-xs text-muted mb-1">{f.label}</div>
                  <div className="text-lg font-semibold text-ink">{f.value}</div>
                  <div className="text-xs text-muted mt-1">{f.benchmark}</div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </>
  );
}
