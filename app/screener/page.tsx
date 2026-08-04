import { Card, EmptyState } from "@/components/card";
import { PageHeader } from "@/components/page-header";

export default function ScreenerPage() {
  return (
    <>
      <PageHeader title="Screener" caption="Factor scores: valuation · growth · quality · momentum" />
      <Card>
        <EmptyState>No scores yet — the signal engine and screener arrive with Epic D.</EmptyState>
      </Card>
    </>
  );
}
