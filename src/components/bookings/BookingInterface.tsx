import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { toast } from "sonner";
import { Id } from "@convex/_generated/dataModel";
import { useForm } from '@tanstack/react-form';
import * as v from 'valibot';
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ConvexError } from "convex/values";

interface BookingInterfaceProps {
  meetingId: string;
}

const bookingSchema = v.object({
  bookerPhone: v.pipe(
    v.string(),
    v.regex(/^\+?\d{0,3}\s?[(]?\d{3}[)]?[-\s\.]?\d{3}[-\s\.]?\d{4}$/, "Invalid phone number format")
  ),
  bookerEmail: v.pipe(v.string(), v.email("Invalid email address")),
});

export function BookingInterface({ meetingId }: BookingInterfaceProps) {
  const [selectedSlotId, setSelectedSlotId] = useState<Id<'timeSlot'> | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);

  const meeting = useQuery(
    api.meetings.getMeeting,
    meetingId ? { meetingId: meetingId } : "skip"
  );
  const bookMeeting = useMutation(api.meetings.bookMeeting);
  const cancelBooking = useMutation(api.meetings.cancelBooking);
  const loggedInUser = useQuery(api.auth.loggedInUser);

  const form = useForm({
    defaultValues: {
      bookerPhone: '',
      bookerEmail: '',
    },
    validators: {
      onBlur: bookingSchema,
      onSubmit: bookingSchema,
    },
    onSubmit: async ({ value }) => {
      if (!selectedSlotId || !meeting) return;

      try {
        await bookMeeting({
          meetingId: meeting._id,
          timeSlotId: selectedSlotId,
          bookerPhone: value.bookerPhone.trim(),
          bookerEmail: value.bookerEmail.trim(),
        });

        toast.success("Time slot booked successfully!");
        form.reset();
      } catch (error: any) {
        toast.error(error instanceof ConvexError ? error.data : "Failed to book time slot");
      }
    },
  });

  const handleBookSlot = async () => {
    if (!selectedSlotId || !meeting) return;

    // If logged in, we can skip the form validation/submission for phone/email
    // But since the original code allowed logged in users to book without phone/email,
    // we need to handle that.

    if (loggedInUser) {
      try {
        await bookMeeting({
          meetingId: meeting._id,
          timeSlotId: selectedSlotId,
        });
        toast.success("Time slot booked successfully!");
      } catch (error: any) {
        toast.error(error instanceof ConvexError ? error.data : "Failed to book time slot");
      }
      return;
    }

    form.handleSubmit();
  };

  const handleCancelBooking = async () => {
    if (!meeting) return;

    setIsCancelling(true);

    try {
      await cancelBooking({ meetingId: meeting._id });
      toast.success("Booking cancelled successfully!");
      setIsCancelDialogOpen(false);
    } catch (error: any) {
      toast.error(error.message || "Failed to cancel booking");
    } finally {
      setIsCancelling(false);
    }
  };

  const formatDateTime = (dateString: number) => {
    const date = new Date(dateString * 1000); // Convert seconds to milliseconds
    return date.toLocaleString([], {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatTime = (dateString: number) => {
    const date = new Date(dateString * 1000); // Convert seconds to milliseconds
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (meeting === undefined) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (meeting === null) {
    return (
      <div className="max-w-md mx-auto text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Meeting Not Found</h2>
        <p className="text-gray-600 mb-4">
          The meeting you're looking for doesn't exist or is no longer active.
        </p>
      </div>
    );
  }

  // Filter available slots to exclude booked ones for this meeting
  const availableSlots = meeting.availableSlots

  // Check if this meeting already has a booked time slot from the database
  const bookedSlot = meeting.timeSlotId
    ? meeting.availableSlots.find(slot => slot && slot._id === meeting.timeSlotId) || null
    : null;

  // For UI selection (before booking)
  const selectedSlot = selectedSlotId
    ? meeting.availableSlots.find(slot => slot && slot._id === selectedSlotId) || null
    : null;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Advisement meeting with {meeting.student.name}</h1>
        {/*meeting.description && (
          <p className="text-gray-600 mt-2">{meeting.description}</p>
        )*/}
        <p className="text-sm text-gray-500 mt-1">Duration: 15 minutes</p>
      </div>

      {bookedSlot ? (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
          <h3 className="text-lg font-semibold text-green-800 mb-2">Your Booking</h3>
          <p className="text-green-700">
            You have booked: {formatDateTime(bookedSlot.startDateTime)} - {formatTime(bookedSlot.endDateTime)}
          </p>

          <Dialog open={isCancelDialogOpen} onOpenChange={setIsCancelDialogOpen}>
            <DialogTrigger asChild>
              <button
                className="mt-3 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel Booking
              </button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Cancel Booking</DialogTitle>
                <DialogDescription>
                  Are you sure you want to cancel this booking? This action cannot be undone.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">No, Keep Booking</Button>
                </DialogClose>
                <Button variant="destructive" onClick={handleCancelBooking} disabled={isCancelling}>
                  {isCancelling ? "Cancelling..." : "Yes, Cancel Booking"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-lg border p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Available Time Slots</h3>

            {availableSlots.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                No available time slots at the moment.
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {availableSlots.map((slot) => (
                  <button
                    key={slot._id}
                    onClick={() => setSelectedSlotId(
                      selectedSlotId === slot._id ? null : slot._id
                    )}
                    className={`p-4 text-left border rounded-lg transition-colors ${selectedSlotId === slot._id
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-300 hover:border-gray-400 hover:bg-gray-50"
                      }`}
                  >
                    <div className="font-medium text-gray-900">
                      {new Date(slot.startDateTime * 1000).toLocaleDateString([], {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </div>
                    <div className="text-sm text-gray-600">
                      {formatTime(slot.startDateTime)} - {formatTime(slot.endDateTime)}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {selectedSlot && (
            <div className="bg-white rounded-lg border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Book This Slot</h3>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <h4 className="font-semibold text-blue-900 mb-2">Selected Time Slot</h4>
                <p className="text-blue-800">
                  {formatDateTime(selectedSlot.startDateTime)} - {formatTime(selectedSlot.endDateTime)}
                </p>
              </div>

              {!loggedInUser && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <form.Field
                    name="bookerPhone"
                    children={(field) => {
                      const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
                      return (
                        <Field data-invalid={isInvalid}>
                          <FieldLabel htmlFor="bookerPhone">Your Phone Number *</FieldLabel>
                          <Input
                            type="text"
                            id="bookerPhone"
                            name={field.name}
                            value={field.state.value}
                            onBlur={field.handleBlur}
                            onChange={(e) => field.handleChange(e.target.value)}
                            aria-invalid={isInvalid}
                            placeholder="Enter your phone number"
                          />
                          {isInvalid && <FieldError errors={field.state.meta.errors} />}
                        </Field>
                      );
                    }}
                  />
                  <form.Field
                    name="bookerEmail"
                    children={(field) => {
                      const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
                      return (
                        <Field data-invalid={isInvalid}>
                          <FieldLabel htmlFor="bookerEmail">Your Email *</FieldLabel>
                          <Input
                            type="email"
                            id="bookerEmail"
                            name={field.name}
                            value={field.state.value}
                            onBlur={field.handleBlur}
                            onChange={(e) => field.handleChange(e.target.value)}
                            aria-invalid={isInvalid}
                            placeholder="Enter your email"
                          />
                          {isInvalid && <FieldError errors={field.state.meta.errors} />}
                        </Field>
                      );
                    }}
                  />
                </div>
              )}

              <form.Subscribe
                selector={(state) => [state.canSubmit, state.isSubmitting]}
                children={([canSubmit, isSubmitting]) => (
                  <Button
                    onClick={handleBookSlot}
                    disabled={!loggedInUser && !canSubmit}
                    className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? "Booking..." : "Confirm Booking"}
                  </Button>
                )}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}
