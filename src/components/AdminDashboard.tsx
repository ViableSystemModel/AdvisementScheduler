import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { CreateMeetingForm } from "./CreateMeetingForm";
import { TimeSlotManager } from "./TimeSlotManager";
import { toast } from "sonner";
import { Id } from "../../convex/_generated/dataModel";

export function AdminDashboard() {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [activeTab, setActiveTab] = useState<"meetings" | "timeSlots">("timeSlots");
  const meetings = useQuery(api.meetings.getUserMeetings) || [];
  const toggleMeetingStatus = useMutation(api.meetings.toggleMeetingStatus);

  const handleToggleStatus = async (meetingId: Id<"meetings">) => {
    try {
      await toggleMeetingStatus({ meetingId });
      toast.success("Meeting status updated");
    } catch (error) {
      toast.error("Failed to update meeting status");
    }
  };

  const copyBookingLink = (meetingId: string) => {
    const url = `${window.location.origin}?meeting=${meetingId}`;
    navigator.clipboard.writeText(url);
    toast.success("Booking link copied to clipboard!");
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        {activeTab === "meetings" && (
          <button
            onClick={() => setShowCreateForm(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Create New Meeting
          </button>
        )}
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab("timeSlots")}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === "timeSlots"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            Time Slots
          </button>
          <button
            onClick={() => setActiveTab("meetings")}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === "meetings"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            Meetings
          </button>
        </nav>
      </div>

      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CreateMeetingForm onClose={() => setShowCreateForm(false)} />
          </div>
        </div>
      )}

      {activeTab === "timeSlots" && (
        <div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h3 className="font-medium text-blue-900 mb-2">How Time Slots Work</h3>
            <p className="text-sm text-blue-800">
              Create time slots that can be used across all your meetings. When someone books a meeting, 
              they'll choose from your available time slots that match the meeting duration.
            </p>
          </div>
          <TimeSlotManager />
        </div>
      )}

      {activeTab === "meetings" && (
        <div className="grid gap-6">
          {meetings.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg border">
              <p className="text-gray-500 mb-4">No meetings created yet</p>
              <button
                onClick={() => setShowCreateForm(true)}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Create your first meeting
              </button>
            </div>
          ) : (
            meetings.map((meeting) => (
              <div key={meeting._id} className="bg-white rounded-lg border p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">{meeting.title}</h3>
                    {meeting.description && (
                      <p className="text-gray-600 mt-1">{meeting.description}</p>
                    )}
                    <p className="text-sm text-gray-500 mt-2">
                      Duration: {meeting.duration} minutes
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        meeting.isActive
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {meeting.isActive ? "Active" : "Inactive"}
                    </span>
                    <button
                      onClick={() => handleToggleStatus(meeting._id)}
                      className="text-sm text-blue-600 hover:text-blue-700"
                    >
                      {meeting.isActive ? "Deactivate" : "Activate"}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="bg-gray-50 p-3 rounded">
                    <p className="text-sm text-gray-600">Available Slots</p>
                    <p className="text-lg font-semibold">{meeting.availableSlotCount}</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded">
                    <p className="text-sm text-gray-600">Bookings</p>
                    <p className="text-lg font-semibold">{meeting.bookingCount}</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded">
                    <p className="text-sm text-gray-600">Available</p>
                    <p className="text-lg font-semibold">
                      {meeting.availableSlotCount - meeting.bookingCount}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => copyBookingLink(meeting._id)}
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
                  >
                    Copy Booking Link
                  </button>
                  <a
                    href={`?meeting=${meeting._id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 transition-colors"
                  >
                    Preview Booking Page
                  </a>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
