import { useMutation } from "convex/react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { api } from "@convex/_generated/api";
import * as v from 'valibot';
import { useForm } from "@tanstack/react-form";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { DatePicker } from "@/components/ui/date-picker";
import { DateTime } from "luxon";

const formSchema = v.object({
  displayName: v.pipe(v.string(), v.minLength(4)),
  startDate: v.pipe(
    v.date(),
    v.toMinValue(DateTime.now().startOf('day').toJSDate()),
  ),
  endDate: v.pipe(
    v.date(),
    v.toMinValue(DateTime.now().startOf('day').toJSDate()),
  ),
})

export function SemesterCreationDialog() {
  const createSemester = useMutation(api.semesters.create)
  const creationForm = useForm({
    defaultValues: {
      displayName: '',
      startDate: new Date(),
      endDate: new Date(),
    },
    validators: {
      onBlur: formSchema,
      onSubmit: formSchema,
    },
    onSubmit: async ({ value }) => {
      await createSemester({
        displayName: value.displayName,
        startDate: Math.round(value.startDate.getTime() / 1000),
        endDate: Math.round(value.endDate.getTime() / 1000)
      })
    }
  })

  return (
    <Dialog>
      <form
        id='semester-creation-form'
        onSubmit={e => {
          e.preventDefault()
          creationForm.handleSubmit()
        }}
      >
        <DialogTrigger asChild>
          <Button variant="outline">Open Dialog</Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit profile</DialogTitle>
            <DialogDescription>
              Make changes to your profile here. Click save when you&apos;re
              done.
            </DialogDescription>
          </DialogHeader>
          <creationForm.Field
            name='displayName'
            children={(field) => {
              const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid
              return (
                <Field data-invalid={isInvalid}>
                  <FieldLabel htmlFor="displayName">Display Name</FieldLabel>
                  <Input
                    type='text'
                    id="displayName"
                    name={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    aria-invalid={isInvalid}
                    aria-label='Semester Display Name'
                    placeholder="Fall 1994"
                  />
                  {isInvalid && <FieldError errors={field.state.meta.errors} />}
                </Field>
              )
            }}
          />
          <creationForm.Field
            name='startDate'
            children={field => {
              const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid
              return (
                <Field data-invalid={isInvalid}>
                  <FieldLabel htmlFor="startDate">Start Date</FieldLabel>
                  <DatePicker
                    date={field.state.value}
                    onChange={d => field.handleChange(d ?? new Date())}
                    aria-label='Start Date'
                  />
                  {isInvalid && <FieldError errors={field.state.meta.errors} />}
                </Field>
              )
            }}
          />
          <creationForm.Field
            name='endDate'
            children={field => {
              const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid
              return (
                <Field data-invalid={isInvalid}>
                  <FieldLabel htmlFor="endDate">End Date</FieldLabel>
                  <DatePicker
                    date={field.state.value}
                    onChange={d => field.handleChange(d ?? new Date())}
                    aria-label='End Date'
                  />
                  {isInvalid && <FieldError errors={field.state.meta.errors} />}
                </Field>
              )
            }}
          />
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button type='submit' form='semester-creation-form'>Create</Button>
          </DialogFooter>
        </DialogContent>
      </form>
    </Dialog>
  )
}