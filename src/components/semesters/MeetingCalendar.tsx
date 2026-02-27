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
    events={(meetings ?? []).map(meeting => ({
      title: meeting.student?.name || 'Meeting',
      start: meeting.timeSlot?.startDateTime
        ? new Date(meeting.timeSlot?.startDateTime * 1000)
        : undefined,
      end: meeting.timeSlot?.endDateTime
        ? new Date(meeting.timeSlot?.endDateTime * 1000)
        : undefined,
      extendedProps: {
        student: meeting.student
      }
    }))}
    contentHeight='500px'
    eventContent={event => event.event.title}
  />
}