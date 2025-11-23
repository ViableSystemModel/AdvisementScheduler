import { BookingInterface } from '@/components/BookingInterface'
import { createFileRoute } from '@tanstack/react-router'
import {valibotValidator} from '@tanstack/valibot-adapter'
import * as v from 'valibot'

export const Route = createFileRoute('/meeting/$meetingId')({
  validateSearch: valibotValidator(v.object({
    id: v.optional(
      v.fallback(v.pipe(v.string(), v.uuid()), ''),
      '',
    ),
  })),
  component: function RouteComponent() {
    const {meetingId} = Route.useParams()
    if (meetingId === '') {
      return (
      <div className="max-w-md mx-auto text-center mb-8">
        <p className="text-gray-600">A meeting ID was not provided or was invalid.</p>
        <p className="text-gray-600">Please email your advisor for a meeting scheduler link</p>
      </div>
      )
    }
    return <BookingInterface meetingId={meetingId} />
  }
})

