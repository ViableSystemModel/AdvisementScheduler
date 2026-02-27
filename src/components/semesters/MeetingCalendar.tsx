import FullCalendar from "@fullcalendar/react"
import timeGridPlugin from "@fullcalendar/timegrid"
import dayGridPlugin from "@fullcalendar/daygrid"
import { useQuery } from "convex/react"
import { api } from "@convex/_generated/api"
import { Id } from "@convex/_generated/dataModel"

export function MeetingCalendar({ semesterId }: { semesterId: Id<'semester'> }) {
  const meetings = (useQuery(api.meetings.listForSemester, { semesterId }) ?? [])
    .filter(m => m.student != null && m.timeSlot != null)
    .map(m => ({ student: m.student!, timeSlot: m.timeSlot! }))
  const bookedTimeSlotsIds = meetings.map(m => m.timeSlot._id)
  const timeSlots = (useQuery(api.timeSlots.listForAdvisor, { semesterId }) ?? [])
    .filter(slot => !bookedTimeSlotsIds.includes(slot._id))
  return <FullCalendar
    plugins={[timeGridPlugin, dayGridPlugin]}
    initialView='timeGridWeek'
    weekends={true}
    events={[
      ...(meetings ?? []).map(meeting => ({
        title: meeting.student.name,
        start: new Date(meeting.timeSlot.startDateTime * 1000),
        end: new Date(meeting.timeSlot.endDateTime * 1000),
        borderColor: 'black',
        extendedProps: {
          type: 'booked'
        }
      })),
      ...(timeSlots ?? []).map(slot => ({
        title: 'Available',
        start: new Date(slot.startDateTime * 1000),
        end: new Date(slot.endDateTime * 1000),
        backgroundColor: 'gray',
        borderColor: 'black',
        extendedProps: {
          type: 'available'
        }
      }))
    ]}
    slotDuration='00:15:00'
    slotLabelInterval='01:00'
    contentHeight='500px'
    eventContent={event => event.event.extendedProps.type === 'booked' ? (
      event.event.title
    ) : (
      <div className="bg-gray-500">Available</div>
    )}
  />
}