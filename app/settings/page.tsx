import { Card } from "@/components/card";
import { PageHeader } from "@/components/page-header";
import { AdminPanel } from "@/components/admin-panel";
import { ErrorBoundary } from "@/components/error-boundary";

export default function SettingsPage() {
  return (
    <>
      <PageHeader title="Settings" caption="Providers, refresh cadence, and scoring presets" />
      <div className="grid grid-cols-12 gap-4">
        <Card title="Admin Setup" className="col-span-12 lg:col-span-6">
          <ErrorBoundary>
            <AdminPanel />
          </ErrorBoundary>
        </Card>
      </div>
    </>
  );
}
