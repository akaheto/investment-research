import { Card, EmptyState } from "@/components/card";
import { PageHeader } from "@/components/page-header";

export default function NewsPage() {
  return (
    <>
      <PageHeader title="News" caption="Headlines tagged to your instruments and accounts" />
      <Card>
        <EmptyState>No headlines yet — news ingestion arrives with Epic E.</EmptyState>
      </Card>
    </>
  );
}
