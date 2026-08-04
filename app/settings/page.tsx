import { Card, EmptyState } from "@/components/card";
import { PageHeader } from "@/components/page-header";

export default function SettingsPage() {
  return (
    <>
      <PageHeader title="Settings" caption="Providers, refresh cadence, and scoring presets" />
      <Card>
        <EmptyState>Nothing to configure yet — provider and preset settings arrive with later epics.</EmptyState>
      </Card>
    </>
  );
}
