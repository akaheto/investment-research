import { Card } from "@/components/card";
import { PageHeader } from "@/components/page-header";
import { LAUNCHPAD_PROJECTS } from "@/lib/launchpad";
import Link from "next/link";

/**
 * Launchpad — where new functionality gets tried out before it's promoted
 * to the real app. Projects here are separate from and not synced with
 * their real-app counterparts.
 */
export default function LaunchpadPage() {
  return (
    <>
      <PageHeader title="Launchpad" caption="Testing ground for new functionality before it ships" />
      <div className="grid grid-cols-12 gap-4">
        {LAUNCHPAD_PROJECTS.map((project) => (
          <Card key={project.slug} title={project.title} className="col-span-12 lg:col-span-6">
            <p className="text-sm text-muted mb-3">{project.description}</p>
            <Link href={`/launchpad/${project.slug}`} className="text-sm text-accent hover:underline">
              Open →
            </Link>
          </Card>
        ))}
      </div>
    </>
  );
}
