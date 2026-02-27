import FullCalendar from "@fullcalendar/react"
import timeGridPlugin from "@fullcalendar/timegrid"
import dayGridPlugin from "@fullcalendar/daygrid"
import { useQuery } from "convex/react"
import { api } from "@convex/_generated/api"
import { Id } from "@convex/_generated/dataModel"

export function MeetingCalendar({ semesterId }: { semesterId: Id<'semester'> }) {
  const meetings = useQuery(api.meetings.listForSemester, { semesterId })
  return <FullCalendar
    plugins={[timeGridPlugin, dayGridPlugin]}
    initialView='timeGridWeek'
    weekends={true}
    height='500px'
    events={meetings ?? []}
    eventContent={event => (
      <div>
        {event.event.extendedProps.student?.name || 'Meeting'}
      </div>
    )}
  />
}