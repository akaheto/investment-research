import { Card, EmptyState } from "@/components/card";
import { PageHeader } from "@/components/page-header";

export default function MarketsPage() {
  return (
    <>
      <PageHeader title="Markets" caption="Indices, rates, and the macro regime" />
      <Card>
        <EmptyState>No data yet — market overview arrives with deliverable C4.</EmptyState>
      </Card>
    </>
  );
}
