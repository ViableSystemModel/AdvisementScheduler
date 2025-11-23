import { useMutation, useQuery } from "convex/react"
import { api } from "@convex/_generated/api"
import { Id } from "@convex/_generated/dataModel"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Spinner } from "@/components/ui/spinner"
import { DateTime } from "luxon"
import { Trash2, Plus } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import { ConvexError } from "convex/values"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { DateTimeMultiSelect } from "@/components/ui/date-time-multi-select"
import { Field, FieldLabel } from "@/components/ui/field"

interface TimeSlotManagerProps {
  semesterId: Id<"semester">
}

export function TimeSlotManager({ semesterId }: TimeSlotManagerProps) {
  const timeSlots = useQuery(api.timeSlots.listForAdvisor, { semesterId })
  const semester = useQuery(api.semesters.get, { id: semesterId })
  const deleteTimeSlot = useMutation(api.timeSlots.deleteOne)
  const createTimeSlots = useMutation(api.timeSlots.createBulk)
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined)
  const [selectedTimes, setSelectedTimes] = useState<string[]>([])
  const [timezone, setTimezone] = useState('America/New_York')

  // Convert semester dates to Date objects for the date picker
  const minDate = semester ? DateTime.fromSeconds(semester.startDate).toJSDate() : undefined
  const maxDate = semester ? DateTime.fromSeconds(semester.endDate).toJSDate() : undefined

  const handleDelete = async (timeSlotId: Id<"timeSlot">) => {
    try {
      await deleteTimeSlot({ timeSlotId })
      toast.success("Time slot deleted successfully")
    } catch (error) {
      console.error(error)
      toast.error(
        error instanceof ConvexError
          ? error.data
          : "Failed to delete time slot"
      )
    }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedDate) {
      toast.error("Please select a date")
      return
    }

    if (selectedTimes.length === 0) {
      toast.error("Please add at least one time")
      return
    }

    setLoading(true)
    try {
      // Convert date and times to Unix timestamps using the selected timezone
      const starts = selectedTimes.map(time => {
        const [hours, minutes] = time.split(':').map(Number)
        const dt = DateTime.fromJSDate(selectedDate, { zone: timezone })
          .set({ hour: hours, minute: minutes, second: 0, millisecond: 0 })
        return dt.toSeconds()
      })

      await createTimeSlots({
        starts,
        semesterId,
        timezone,
      })

      const count = selectedTimes.length
      toast.success(`${count} time slot${count > 1 ? 's' : ''} created successfully`)
      setOpen(false)
      setSelectedDate(undefined)
      setSelectedTimes([])
    } catch (error) {
      console.error(error)
      toast.error(
        error instanceof ConvexError
          ? error.data
          : "Failed to create time slots"
      )
    } finally {
      setLoading(false)
    }
  }

  if (timeSlots === undefined) {
    return <Spinner />
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Time Slots</h2>
        <Dialog open={open} onOpenChange={(isOpen) => {
          setOpen(isOpen)
          if (!isOpen) {
            setSelectedDate(undefined)
            setSelectedTimes([])
          }
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Time Slots
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleCreate}>
              <DialogHeader>
                <DialogTitle>Create Time Slots</DialogTitle>
                <DialogDescription>
                  Select a date and add multiple times. Each slot will be 15 minutes long.
                </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <Field>
                  <FieldLabel>Date & Times</FieldLabel>
                  <DateTimeMultiSelect
                    date={selectedDate}
                    times={selectedTimes}
                    timezone={timezone}
                    minDate={minDate}
                    maxDate={maxDate}
                    onDateChange={setSelectedDate}
                    onTimesChange={setSelectedTimes}
                    onTimezoneChange={setTimezone}
                  />
                </Field>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? "Creating..." : `Create ${selectedTimes.length || ''} Slot${selectedTimes.length !== 1 ? 's' : ''}`}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {timeSlots.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          No time slots created yet. Click "Add Time Slots" to get started.
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Start Time</TableHead>
              <TableHead>End Time</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {timeSlots.map((slot) => {
              const start = DateTime.fromSeconds(slot.startDateTime)
              const end = DateTime.fromSeconds(slot.endDateTime)
              return (
                <TableRow key={slot._id}>
                  <TableCell>{start.toLocaleString(DateTime.DATE_MED)}</TableCell>
                  <TableCell>{start.toLocaleString(DateTime.TIME_SIMPLE)}</TableCell>
                  <TableCell>{end.toLocaleString(DateTime.TIME_SIMPLE)}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive/90"
                      onClick={() => handleDelete(slot._id)}
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Delete</span>
                    </Button>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      )}
    </div>
  )
}
