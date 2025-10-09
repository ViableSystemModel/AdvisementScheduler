import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";
import { Id } from "../../convex/_generated/dataModel";

interface BookingInterfaceProps {
  meetingId: string;
  onMeetingIdChange: (id: string) => void;
}

export function BookingInterface({ meetingId, onMeetingIdChange }: BookingInterfaceProps) {
  const [selectedSlotId, setSelectedSlotId] = useState<Id<"timeSlots"> | null>(null);
  const [bookerName, setBookerName] = useState("");
  const [bookerEmail, setBookerEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const meeting = useQuery(
    api.meetings.getMeeting,
    meetingId ? { meetingId: meetingId as Id<"meetings"> } : "skip"
  );
  const bookSlot = useMutation(api.meetings.bookSlot);
  const cancelBooking = useMutation(api.meetings.cancelBooking);
  const loggedInUser = useQuery(api.auth.loggedInUser);

  const handleBookSlot = async () => {
    if (!selectedSlotId || !meeting) return;

    if (!loggedInUser && (!bookerName.trim() || !bookerEmail.trim())) {
      toast.error("Please enter your name and email");
      return;
    }

    setIsSubmitting(true);

    try {
      await bookSlot({
        meetingId: meeting._id,
        timeSlotId: selectedSlotId,
        bookerName: bookerName.trim() || undefined,
        bookerEmail: bookerEmail.trim() || undefined,
      });

      toast.success("Time slot booked successfully!");
      setSelectedSlotId(null);
      setBookerName("");
      setBookerEmail("");
    } catch (error: any) {
      toast.error(error.message || "Failed to book time slot");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelBooking = async () => {
    if (!meeting) return;

    try {
      await cancelBooking({ meetingId: meeting._id });
      toast.success("Booking cancelled successfully!");
    } catch (error: any) {
      toast.error(error.message || "Failed to cancel booking");
    }
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString([], {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (!meetingId) {
    return (
      <div className="max-w-md mx-auto">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Book a Meeting</h2>
        <div className="space-y-4">
          <div>
            <label htmlFor="meetingId" className="block text-sm font-medium text-gray-700 mb-1">
              Meeting ID
            </label>
            <input
              type="text"
              id="meetingId"
              value={meetingId}
              onChange={(e) => onMeetingIdChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter meeting ID"
            />
          </div>
          <p className="text-sm text-gray-500">
            Enter the meeting ID provided by the organizer to view available time slots.
          </p>
        </div>
      </div>
    );
  }

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
        <button
          onClick={() => onMeetingIdChange("")}
          className="text-blue-600 hover:text-blue-700 font-medium"
        >
          Try a different meeting ID
        </button>
      </div>
    );
  }

  // Filter available slots to exclude booked ones for this meeting
  const availableSlots = meeting.availableSlots.filter(
    slot => slot && !meeting.bookedSlotIds.includes(slot._id)
  );

  const selectedSlot = selectedSlotId 
    ? meeting.availableSlots.find(slot => slot && slot._id === selectedSlotId) || null
    : null;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">{meeting.title}</h1>
        {meeting.description && (
          <p className="text-gray-600 mt-2">{meeting.description}</p>
        )}
        <p className="text-sm text-gray-500 mt-1">Duration: {meeting.duration} minutes</p>
      </div>

      {meeting.userBookedSlot ? (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
          <h3 className="text-lg font-semibold text-green-800 mb-2">Your Booking</h3>
          <p className="text-green-700">
            You have booked: {formatDateTime(meeting.userBookedSlot.start)} - {formatTime(meeting.userBookedSlot.end)}
          </p>
          <button
            onClick={handleCancelBooking}
            className="mt-3 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors"
          >
            Cancel Booking
          </button>
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
                    className={`p-4 text-left border rounded-lg transition-colors ${
                      selectedSlotId === slot._id
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-300 hover:border-gray-400 hover:bg-gray-50"
                    }`}
                  >
                    <div className="font-medium text-gray-900">
                      {new Date(slot.start).toLocaleDateString([], {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </div>
                    <div className="text-sm text-gray-600">
                      {formatTime(slot.start)} - {formatTime(slot.end)}
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
                  {formatDateTime(selectedSlot.start)} - {formatTime(selectedSlot.end)}
                </p>
              </div>
              
              {!loggedInUser && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label htmlFor="bookerName" className="block text-sm font-medium text-gray-700 mb-1">
                      Your Name *
                    </label>
                    <input
                      type="text"
                      id="bookerName"
                      value={bookerName}
                      onChange={(e) => setBookerName(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter your name"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="bookerEmail" className="block text-sm font-medium text-gray-700 mb-1">
                      Your Email *
                    </label>
                    <input
                      type="email"
                      id="bookerEmail"
                      value={bookerEmail}
                      onChange={(e) => setBookerEmail(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter your email"
                      required
                    />
                  </div>
                </div>
              )}

              <button
                onClick={handleBookSlot}
                disabled={isSubmitting}
                className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "Booking..." : "Confirm Booking"}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
