import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from 'convex/react'
import { api } from '@convex/_generated/api'
import { Id } from '@convex/_generated/dataModel'
import { Spinner } from '@/components/ui/spinner'
import { TimeSlotManager } from '@/components/time-slots/TimeSlotManager'
import { MeetingManager } from '@/components/semesters/MeetingManager'
import { DateTime } from 'luxon'
import { AdminPage } from '@/components/AdminPage'
import { MeetingCalendar } from '@/components/semesters/MeetingCalendar'

export const Route = createFileRoute('/admin/semesters/$semesterId')({
  component: RouteComponent,
})

function RouteComponent() {
  const { semesterId } = Route.useParams()
  const semester = useQuery(api.semesters.get, { id: semesterId as Id<"semester"> })

  if (semester === undefined) {
    return <Spinner />
  }

  if (semester === null) {
    return (
      <div className="text-center py-8">
        <h1 className="text-2xl font-bold text-destructive">Semester not found</h1>
        <p className="text-muted-foreground mt-2">The semester you're looking for doesn't exist or you don't have access to it.</p>
      </div>
    )
  }

  return (
    <AdminPage segmentOverrides={{ [semesterId]: semester.displayName }}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">{semester.displayName}</h1>
          <p className="text-muted-foreground">Manage time slots and meetings for this semester</p>
          <p className="text-sm text-muted-foreground mt-2">
            <span className="font-medium">Start Date:</span> {DateTime.fromSeconds(semester.startDate).toLocaleString(DateTime.DATE_MED)}
            {' • '}
            <span className="font-medium">End Date:</span> {DateTime.fromSeconds(semester.endDate).toLocaleString(DateTime.DATE_MED)}
          </p>
        </div>

        <div>
          <MeetingCalendar semesterId={semesterId as Id<"semester">} />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="p-6 border rounded-lg shadow-sm">
            <MeetingManager semesterId={semesterId as Id<"semester">} />
          </div>
          <div className="p-6 border rounded-lg shadow-sm">
            <TimeSlotManager semesterId={semesterId as Id<"semester">} />
          </div>
        </div>
      </div>
    </AdminPage>
  )
}

