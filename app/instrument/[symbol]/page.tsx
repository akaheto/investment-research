"use client";

import { Card } from "@/components/card";
import { PageHeader } from "@/components/page-header";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

// TODO C3: Fetch real price history from B2 provider
const priceHistory = [
  { date: "Jul 26", close: 195.2 },
  { date: "Jul 27", close: 196.8 },
  { date: "Jul 28", close: 195.5 },
  { date: "Jul 29", close: 199.1 },
  { date: "Jul 30", close: 198.4 },
  { date: "Jul 31", close: 200.3 },
  { date: "Aug 1", close: 199.8 },
  { date: "Aug 3", close: 198.45 },
];

// TODO C3: Fetch real fundamentals from B3 provider
const fundamentals = [
  { label: "P/E (TTM)", value: "28.5", benchmark: "20-30" },
  { label: "Price / Book", value: "45.2", benchmark: "30-50" },
  { label: "Debt / Equity", value: "0.82", benchmark: "< 1.0" },
  { label: "ROE", value: "89%", benchmark: "> 15%" },
];

export default function InstrumentPage({ params }: { params: { symbol: string } }) {
  return (
    <>
      <PageHeader title={params.symbol} caption="Price history, fundamentals, and composite score" />
      <div className="grid grid-cols-12 gap-4">
        <Card title="Price" className="col-span-12 lg:col-span-8 h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={priceHistory} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--hairline)" />
              <XAxis dataKey="date" stroke="var(--muted)" style={{ fontSize: "12px" }} />
              <YAxis stroke="var(--muted)" style={{ fontSize: "12px" }} />
              <Tooltip contentStyle={{ backgroundColor: "var(--surface)", border: "1px solid var(--hairline)" }} />
              <Line type="monotone" dataKey="close" stroke="var(--accent)" dot={{ fill: "var(--accent)", r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </Card>
        <Card title="Score" className="col-span-12 lg:col-span-4">
          <div className="space-y-3">
            <div className="flex items-baseline justify-between">
              <span className="text-sm text-muted">Composite</span>
              <span className="text-3xl font-semibold text-ink">74</span>
            </div>
            <div className="text-xs text-muted">Balanced preset • High confidence</div>
            <button className="text-sm text-accent hover:underline">View breakdown →</button>
          </div>
        </Card>
        <Card title="Fundamentals" className="col-span-12">
          <div className="grid grid-cols-4 gap-4">
            {fundamentals.map((f) => (
              <div key={f.label} className="border-r border-hairline last:border-r-0">
                <div className="text-xs text-muted mb-1">{f.label}</div>
                <div className="text-lg font-semibold text-ink">{f.value}</div>
                <div className="text-xs text-muted mt-1">{f.benchmark}</div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </>
  );
}
