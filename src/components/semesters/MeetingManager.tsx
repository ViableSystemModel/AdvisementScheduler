import { useMutation, useQuery } from "convex/react"
import { api } from "@convex/_generated/api"
import { Id } from "@convex/_generated/dataModel"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Spinner } from "@/components/ui/spinner"
import { DateTime } from "luxon"
import { Trash2, Plus, Copy, Check } from "lucide-react"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Field, FieldLabel } from "@/components/ui/field"

interface MeetingManagerProps {
  semesterId: Id<"semester">
}

export function MeetingManager({ semesterId }: MeetingManagerProps) {
  const meetings = useQuery(api.meetings.listForSemester, { semesterId })
  const deleteMeeting = useMutation(api.meetings.deleteMeeting)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const handleDelete = async (meetingId: Id<"meeting">) => {
    if (!confirm("Are you sure you want to delete this meeting?")) return
    try {
      await deleteMeeting({ id: meetingId })
      toast.success("Meeting deleted successfully")
    } catch (error) {
      console.error(error)
      toast.error(
        error instanceof ConvexError
          ? error.data
          : "Failed to delete meeting"
      )
    }
  }

  const copyLink = (meetingId: string) => {
    const url = `${window.location.origin}/meetings/${meetingId}`
    navigator.clipboard.writeText(url)
    setCopiedId(meetingId)
    toast.success("Booking link copied")
    setTimeout(() => setCopiedId(null), 2000)
  }

  if (meetings === undefined) {
    return <Spinner />
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Meetings</h2>
        <CreateMeetingDialog semesterId={semesterId} />
      </div>

      {meetings.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          No meetings created yet. Create one to invite a student.
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Student</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Time</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {meetings.map((meeting) => {
              const isBooked = !!meeting.timeSlot
              const startTime = meeting.timeSlot
                ? DateTime.fromSeconds(meeting.timeSlot.startDateTime)
                : null

              return (
                <TableRow key={meeting._id}>
                  <TableCell className="font-medium">
                    {meeting.student?.name || "Unknown Student"}
                  </TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${isBooked ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
                      }`}>
                      {isBooked ? "Booked" : "Pending"}
                    </span>
                  </TableCell>
                  <TableCell>
                    {startTime
                      ? startTime.toLocaleString(DateTime.DATETIME_MED)
                      : "-"
                    }
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => copyLink(meeting.secretCode)}
                        title="Copy Booking Link"
                      >
                        {copiedId === meeting.secretCode ? (
                          <Check className="h-4 w-4 text-green-600" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive/90"
                        onClick={() => handleDelete(meeting._id)}
                        title="Delete Meeting"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
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

function CreateMeetingDialog({ semesterId }: { semesterId: Id<"semester"> }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [selectedStudentId, setSelectedStudentId] = useState<string>("")
  const students = useQuery(api.students.list)
  const createMeeting = useMutation(api.meetings.createMeeting)

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedStudentId) {
      toast.error("Please select a student")
      return
    }

    setLoading(true)
    try {
      await createMeeting({
        studentId: selectedStudentId as Id<"student">,
        semesterId,
      })
      toast.success("Meeting created successfully")
      setOpen(false)
      setSelectedStudentId("")
    } catch (error) {
      console.error(error)
      toast.error(
        error instanceof ConvexError
          ? error.data
          : "Failed to create meeting"
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Create Meeting
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleCreate}>
          <DialogHeader>
            <DialogTitle>Create Meeting</DialogTitle>
            <DialogDescription>
              Select a student to create a meeting invite for.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Field>
              <FieldLabel>Student</FieldLabel>
              <Select value={selectedStudentId} onValueChange={setSelectedStudentId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a student" />
                </SelectTrigger>
                <SelectContent>
                  {students?.map((student) => (
                    <SelectItem key={student._id} value={student._id}>
                      {student.name}
                    </SelectItem>
                  ))}
                  {students?.length === 0 && (
                    <div className="p-2 text-sm text-muted-foreground text-center">
                      No students found. Add students first.
                    </div>
                  )}
                </SelectContent>
              </Select>
            </Field>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !selectedStudentId}>
              {loading ? "Creating..." : "Create Meeting"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
