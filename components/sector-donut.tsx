"use client";

import { PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer } from "recharts";

interface SectorDonutProps {
  data: Array<{ sector: string; count: number }>;
}

// Categorical series palette from VISUAL_STYLE_GUIDE §2.2
const COLORS = ["#2a78d6", "#eb6834", "#1baf7a", "#eda100", "#e87ba4", "#008300", "#4a3aa7", "#e34948"];

export function SectorDonut({ data }: SectorDonutProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-80 text-muted text-sm">
        No sector data available yet
      </div>
    );
  }

  // Limit to 8 sectors; fold extras into "Other"
  let sectors = [...data];
  if (sectors.length > 8) {
    const topSectors = sectors.slice(0, 7);
    const otherCount = sectors.slice(7).reduce((sum, s) => sum + s.count, 0);
    sectors = [...topSectors, { sector: "Other", count: otherCount }];
  }

  return (
    <ResponsiveContainer width="100%" height={320}>
      <PieChart>
        <Pie
          data={sectors}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={100}
          fill="#8884d8"
          paddingAngle={2}
          dataKey="count"
          label={({ sector, count }) => `${sector} (${count})`}
        >
          {sectors.map((_, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          formatter={(value) => `${value} instrument${value > 1 ? "s" : ""}`}
          contentStyle={{ backgroundColor: "var(--surface)", border: "1px solid var(--hairline)" }}
        />
        <Legend wrapperStyle={{ paddingTop: "20px" }} />
      </PieChart>
    </ResponsiveContainer>
  );
}
