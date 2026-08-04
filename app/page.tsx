import { Card, EmptyState } from "@/components/card";
import { PageHeader } from "@/components/page-header";

/** Dashboard — market overview lands here in C4. */
export default function DashboardPage() {
  return (
    <>
      <PageHeader title="Dashboard" caption="Market overview, your accounts, and what changed" />
      <div className="grid grid-cols-12 gap-4">
        <Card title="Markets" className="col-span-12 lg:col-span-8">
          <EmptyState>No data yet — indices, yield curve, and crypto arrive with deliverable C4.</EmptyState>
        </Card>
        <Card title="Watchlist" className="col-span-12 lg:col-span-4">
          <EmptyState>Empty — add instruments under Watchlist (C2).</EmptyState>
        </Card>
        <Card title="News" className="col-span-12">
          <EmptyState>No headlines yet — the news feed lands with C5/E1.</EmptyState>
        </Card>
      </div>
    </>
  );
}
