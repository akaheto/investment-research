import { getUpcomingEvents } from "@/app/events/actions";
import { Card, EmptyState } from "@/components/card";

export async function EventsWidget() {
  const events = await getUpcomingEvents(30);

  if (events.length === 0) {
    return (
      <Card title="Upcoming Events" className="col-span-12 lg:col-span-6">
        <EmptyState>No events in the next 30 days</EmptyState>
      </Card>
    );
  }

  return (
    <Card title="Upcoming Events (Next 30 Days)" className="col-span-12 lg:col-span-6">
      <div className="space-y-3">
        {events.slice(0, 8).map((event) => (
          <div key={event.id} className="border-b border-hairline pb-3 last:border-b-0">
            <div className="flex items-start justify-between mb-1">
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold">{event.title}</div>
                <div className="text-xs text-muted mt-0.5">{event.eventDate}</div>
              </div>
              <span
                className={`inline-block text-xs px-2 py-0.5 rounded ml-2 ${
                  event.eventType === "fomc_meeting"
                    ? "bg-accent/10 text-accent"
                    : event.eventType === "cpi_release"
                      ? "bg-warning/10 text-warning"
                      : "bg-surface text-muted"
                }`}
              >
                {event.eventType.replace(/_/g, " ")}
              </span>
            </div>
            {event.description && (
              <div className="text-xs text-muted">{event.description}</div>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
}
