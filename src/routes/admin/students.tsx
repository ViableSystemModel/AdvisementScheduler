import { AdminPage } from '@/components/AdminPage';
import { createFileRoute } from '@tanstack/react-router'
import { H1 } from '@/components/ui/typography';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@convex/_generated/api';
import { Spinner } from '@/components/ui/spinner';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useState } from 'react';
import { toast } from 'sonner';
import { ConvexError } from 'convex/values';
import { Plus, Trash2 } from 'lucide-react';
import { Field, FieldLabel, FieldError } from '@/components/ui/field';
import { useForm } from '@tanstack/react-form';
import * as v from 'valibot';
import { Id } from '@convex/_generated/dataModel';

export const Route = createFileRoute('/admin/students')({
  component: StudentsPage,
})

const studentSchema = v.object({
  name: v.pipe(v.string(), v.minLength(2, 'Name must be at least 2 characters')),
  email: v.union([v.literal(''), v.pipe(v.string(), v.email('Invalid email address'))]),
  phone: v.string(),
})

function StudentCreationDialog() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const createStudent = useMutation(api.students.create)

  const form = useForm({
    defaultValues: {
      name: '',
      email: '',
      phone: '',
    },
    validators: {
      onChange: studentSchema,
      onSubmit: studentSchema,
    },
    onSubmit: async ({ value }) => {
      setLoading(true)
      try {
        await createStudent({
          name: value.name,
          email: value.email || undefined,
          phone: value.phone || undefined,
        })
        toast.success('Student created successfully')
        setOpen(false)
        form.reset()
      } catch (error) {
        toast.error(
          error instanceof ConvexError
            ? error.data
            : 'Failed to create student'
        )
      } finally {
        setLoading(false)
      }
    },
  })

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Add Student
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Student</DialogTitle>
          <DialogDescription>
            Add a new student to your roster.
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            e.stopPropagation()
            form.handleSubmit()
          }}
          className="space-y-4"
        >
          <form.Field
            name="name"
            children={(field) => (
              <Field>
                <FieldLabel>Name</FieldLabel>
                <Input
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                />
                {field.state.meta.errors && <FieldError errors={field.state.meta.errors} />}
              </Field>
            )}
          />
          <form.Field
            name="email"
            children={(field) => (
              <Field>
                <FieldLabel>Email (Optional)</FieldLabel>
                <Input
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                />
                {field.state.meta.errors && <FieldError errors={field.state.meta.errors} />}
              </Field>
            )}
          />
          <form.Field
            name="phone"
            children={(field) => (
              <Field>
                <FieldLabel>Phone (Optional)</FieldLabel>
                <Input
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                />
                {field.state.meta.errors && <FieldError errors={field.state.meta.errors} />}
              </Field>
            )}
          />
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" type="button">Cancel</Button>
            </DialogClose>
            <Button type="submit" disabled={loading}>
              {loading ? 'Adding...' : 'Add Student'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function EditStudentDialog({ student }: { student: typeof api.students.list._returnType[0] }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const updateStudent = useMutation(api.students.update)

  const form = useForm({
    defaultValues: {
      name: student.name,
      email: student.email || '',
      phone: student.phone || '',
    },
    validators: {
      onChange: studentSchema,
      onSubmit: studentSchema,
    },
    onSubmit: async ({ value }) => {
      setLoading(true)
      try {
        await updateStudent({
          id: student._id,
          name: value.name,
          email: value.email || undefined,
          phone: value.phone || undefined,
        })
        toast.success('Student updated successfully')
        setOpen(false)
      } catch (error) {
        toast.error(
          error instanceof ConvexError
            ? error.data
            : 'Failed to update student'
        )
      } finally {
        setLoading(false)
      }
    },
  })

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon">
          <span className="sr-only">Edit</span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-4 w-4"
          >
            <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
          </svg>
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Student</DialogTitle>
          <DialogDescription>
            Update student details.
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            e.stopPropagation()
            form.handleSubmit()
          }}
          className="space-y-4"
        >
          <form.Field
            name="name"
            children={(field) => (
              <Field>
                <FieldLabel>Name</FieldLabel>
                <Input
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                />
                {field.state.meta.errors && <FieldError errors={field.state.meta.errors} />}
              </Field>
            )}
          />
          <form.Field
            name="email"
            children={(field) => (
              <Field>
                <FieldLabel>Email (Optional)</FieldLabel>
                <Input
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                />
                {field.state.meta.errors && <FieldError errors={field.state.meta.errors} />}
              </Field>
            )}
          />
          <form.Field
            name="phone"
            children={(field) => (
              <Field>
                <FieldLabel>Phone (Optional)</FieldLabel>
                <Input
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                />
                {field.state.meta.errors && <FieldError errors={field.state.meta.errors} />}
              </Field>
            )}
          />
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" type="button">Cancel</Button>
            </DialogClose>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function StudentList() {
  const students = useQuery(api.students.list)
  const deleteStudent = useMutation(api.students.deleteStudent)

  const handleDelete = async (id: Id<'student'>) => {
    if (!confirm('Are you sure you want to delete this student?')) return
    try {
      await deleteStudent({ id })
      toast.success('Student deleted')
    } catch (error) {
      toast.error('Failed to delete student')
    }
  }

  if (students === undefined) {
    return <Spinner />
  }

  if (students.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No students found. Add one to get started.
      </div>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Phone</TableHead>
          <TableHead>Last Active</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {students.map((student) => (
          <TableRow key={student._id}>
            <TableCell className="font-medium">{student.name}</TableCell>
            <TableCell>{student.email || '-'}</TableCell>
            <TableCell>{student.phone || '-'}</TableCell>
            <TableCell>
              {student.lastMeetingSemester ? (
                student.lastMeetingSemester
              ) : (
                <span className="text-muted-foreground italic">never</span>
              )}
            </TableCell>
            <TableCell className="text-right">
              <div className="flex justify-end gap-2">
                <EditStudentDialog student={student} />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDelete(student._id)}
                  className="text-destructive hover:text-destructive/90"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

function StudentsPage() {
  return (
    <AdminPage>
      <div className="flex justify-between items-center mb-8">
        <H1>Students</H1>
        <StudentCreationDialog />
      </div>
      <div className="border rounded-lg p-4 bg-white">
        <StudentList />
      </div>
    </AdminPage>
  )
}
