import { BookingInterface } from '@/components/bookings/BookingInterface'
import { Id } from '@convex/_generated/dataModel'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/meetings/$meetingId')({
  component: function RouteComponent() {
    const { meetingId } = Route.useParams()
    return <BookingInterface meetingId={meetingId as Id<'meeting'>} />
  }
})

