import { Card, EmptyState } from "@/components/card";
import { PageHeader } from "@/components/page-header";
import Link from "next/link";

/**
 * Launchpad > Oracle — experimental AI-recommendation ideas. Separate
 * from and not synced with the real /oracle page; nothing here is
 * guaranteed to graduate.
 */
export default function LaunchpadOraclePage() {
  return (
    <>
      <PageHeader title="Launchpad · Oracle" caption="Experimental — not connected to the real Oracle page" />
      <Card>
        <EmptyState>Nothing built yet. This is where AI-recommendation ideas get tried out.</EmptyState>
      </Card>
      <div className="mt-4">
        <Link href="/launchpad" className="text-sm text-accent hover:underline">
          ← Back to Launchpad
        </Link>
      </div>
    </>
  );
}
