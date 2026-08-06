"use client";

import { LineChart, Line, ResponsiveContainer } from "recharts";

interface SparklineProps {
  data?: number[];
}

export function Sparkline({ data }: SparklineProps) {
  // Not enough data for a meaningful chart
  if (!data || data.length < 2) {
    return <span className="text-xs text-muted">—</span>;
  }

  // Determine color based on trend: green if up, red if down
  const isUp = data[data.length - 1] >= data[0];
  const stroke = isUp ? "var(--gain-text)" : "var(--loss-text)";

  // Transform data into chart format
  const chartData = data.map((close, idx) => ({ close, idx }));

  return (
    <ResponsiveContainer width={96} height={32}>
      <LineChart data={chartData} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
        <Line
          type="monotone"
          dataKey="close"
          stroke={stroke}
          dot={false}
          strokeWidth={1.5}
          isAnimationActive={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
