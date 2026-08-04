import { Card, EmptyState } from "@/components/card";
import { PageHeader } from "@/components/page-header";

export default function WatchlistPage() {
  return (
    <>
      <PageHeader title="Watchlist" caption="Instruments you track, with live quotes and scores" />
      <Card>
        <EmptyState>Your watchlist is empty — add/quote functionality arrives with deliverable C2.</EmptyState>
      </Card>
    </>
  );
}
