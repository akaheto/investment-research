import { Card } from "@/components/card";

interface EventImpactAssessment {
  accountName: string;
  upcomingEventsCount: number;
  riskLevel: "low" | "moderate" | "high";
  narrative: string;
  generatedAt: string;
}

export function EventImpactCard({ assessment }: { assessment: EventImpactAssessment }) {
  const riskColors = {
    low: "bg-green-100 text-green-800 border-green-200",
    moderate: "bg-yellow-100 text-yellow-800 border-yellow-200",
    high: "bg-red-100 text-red-800 border-red-200",
  };

  const riskLabels = {
    low: "Low Impact",
    moderate: "Moderate Impact",
    high: "High Impact",
  };

  const riskIcons = {
    low: "✓",
    moderate: "⚠",
    high: "🔴",
  };

  const lastUpdated = new Date(assessment.generatedAt).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <Card title="Market Events Impact Assessment" className="col-span-12">
      <div className={`rounded-lg border-l-4 p-4 mb-4 ${riskColors[assessment.riskLevel]}`}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-lg">{riskIcons[assessment.riskLevel]}</span>
            <span className="font-semibold">{riskLabels[assessment.riskLevel]}</span>
          </div>
          <span className="text-xs opacity-75">{assessment.upcomingEventsCount} events ahead</span>
        </div>
        <p className="text-sm leading-relaxed">{assessment.narrative}</p>
      </div>

      <div className="flex items-center justify-between text-xs text-muted">
        <span>Assessment for {assessment.accountName}</span>
        <span>Updated {lastUpdated}</span>
      </div>

      <div className="mt-4 pt-4 border-t border-hairline">
        <p className="text-xs text-muted">
          💡 This assessment is updated automatically when market events are added. Check back before making
          significant portfolio changes.
        </p>
      </div>
    </Card>
  );
}
