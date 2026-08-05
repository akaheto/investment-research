import { Card, EmptyState } from "@/components/card";
import { PageHeader } from "@/components/page-header";
import { getResearchItems } from "./actions";

export const dynamic = "force-dynamic";

/**
 * Research — content authored outside the dashboard (scripts, API feeds,
 * Claude sessions working in this repo) and displayed here. Nothing on
 * this page writes; entries arrive via createResearchItem() elsewhere.
 */
export default async function ResearchPage() {
  const items = await getResearchItems();

  return (
    <>
      <PageHeader title="Research" caption="Findings from research done outside the dashboard" />
      {items.length === 0 ? (
        <Card>
          <EmptyState>No research yet.</EmptyState>
        </Card>
      ) : (
        <div className="space-y-4">
          {items.map((item) => (
            <Card key={item.id} title={item.title}>
              <div className="text-xs text-muted mb-2">
                {new Date(item.publishedAt).toLocaleString()}
              </div>
              <p className="text-sm text-ink whitespace-pre-wrap">{item.body}</p>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
