import { getNarrativeForInstrument } from "@/app/narratives/actions";

export async function NarrativeSection({ instrumentId }: { instrumentId: number }) {
  const result = await getNarrativeForInstrument(instrumentId);

  if (!result.ok || !result.narrative) {
    return (
      <div className="bg-surface rounded-lg p-4 border border-hairline">
        <div className="text-sm text-muted italic">No narrative available</div>
      </div>
    );
  }

  return (
    <div className="bg-surface rounded-lg p-4 border border-hairline">
      <div className="text-xs text-muted mb-2">
        Last updated: {new Date(result.narrative.generatedAt).toLocaleString()}
      </div>
      <p className="text-sm leading-relaxed text-ink">{result.narrative.narrative}</p>
    </div>
  );
}
