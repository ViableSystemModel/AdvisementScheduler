import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";
import { Id } from "../../convex/_generated/dataModel";

interface TimeSlotOption {
  time: string;
  label: string;
}

export function TimeSlotManager() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedTime, setSelectedTime] = useState("09:00");
  const [duration, setDuration] = useState(30);
  const [isCreating, setIsCreating] = useState(false);
  const [selectedTimeSlots, setSelectedTimeSlots] = useState<string[]>([]);
  const [showMultiSelect, setShowMultiSelect] = useState(false);

  const timeSlots = useQuery(api.timeSlots.getUserTimeSlots) || [];
  const createTimeSlot = useMutation(api.timeSlots.createTimeSlot);
  const toggleTimeSlotStatus = useMutation(api.timeSlots.toggleTimeSlotStatus);
  const deleteTimeSlot = useMutation(api.timeSlots.deleteTimeSlot);

  // Generate time slot options (9 AM to 5 PM in 30-minute intervals)
  const generateTimeSlotOptions = (): TimeSlotOption[] => {
    const options: TimeSlotOption[] = [];
    
    // Get existing time slots for the selected date and duration
    const existingSlots = timeSlots.filter(slot => {
      const slotDate = new Date(slot.start).toISOString().split('T')[0];
      return slotDate === selectedDate && slot.duration === duration;
    });
    
    for (let hour = 9; hour < 17; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        const displayHour = hour > 12 ? hour - 12 : hour;
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const displayMinute = minute.toString().padStart(2, '0');
        const label = `${displayHour}:${displayMinute} ${ampm}`;
        
        // Check if this would create a slot that ends after 5 PM
        const endHour = minute + duration >= 60 ? hour + 1 : hour;
        const endMinute = (minute + duration) % 60;
        
        if (endHour < 17 || (endHour === 17 && endMinute === 0)) {
          // Check if this time slot already exists
          const slotExists = existingSlots.some(slot => {
            const slotTime = new Date(slot.start);
            return slotTime.getHours() === hour && slotTime.getMinutes() === minute;
          });
          
          if (!slotExists) {
            options.push({ time, label });
          }
        }
      }
    }
    return options;
  };

  const timeSlotOptions = generateTimeSlotOptions();

  // Clear selections when available options change (e.g., after creating new slots)
  useEffect(() => {
    setSelectedTimeSlots(prev => 
      prev.filter(time => timeSlotOptions.some(option => option.time === time))
    );
  }, [timeSlotOptions.length, selectedDate, duration]);

  const handleCreateTimeSlot = async () => {
    const [hours, minutes] = selectedTime.split(':').map(Number);
    const start = new Date(selectedDate + 'T00:00:00');
    start.setHours(hours, minutes, 0, 0);
    
    const end = new Date(start);
    end.setMinutes(end.getMinutes() + duration);

    setIsCreating(true);

    try {
      await createTimeSlot({
        start: start.toISOString(),
        end: end.toISOString(),
        duration,
      });
      toast.success("Time slot created successfully!");
    } catch (error: any) {
      toast.error(error.message || "Failed to create time slot");
    } finally {
      setIsCreating(false);
    }
  };

  const handleCreateMultipleTimeSlots = async () => {
    if (selectedTimeSlots.length === 0) {
      toast.error("Please select at least one time slot");
      return;
    }

    setIsCreating(true);
    let successCount = 0;
    let errorCount = 0;

    try {
      for (const timeString of selectedTimeSlots) {
        try {
          const [hours, minutes] = timeString.split(':').map(Number);
          const start = new Date(selectedDate + 'T00:00:00');
          start.setHours(hours, minutes, 0, 0);
          
          const end = new Date(start);
          end.setMinutes(end.getMinutes() + duration);

          await createTimeSlot({
            start: start.toISOString(),
            end: end.toISOString(),
            duration,
          });
          successCount++;
        } catch (error: any) {
          errorCount++;
          console.error(`Failed to create slot at ${timeString}:`, error);
        }
      }

      if (successCount > 0) {
        toast.success(`Created ${successCount} time slot${successCount > 1 ? 's' : ''} successfully!`);
      }
      if (errorCount > 0) {
        toast.error(`Failed to create ${errorCount} time slot${errorCount > 1 ? 's' : ''} (may already exist)`);
      }

      // Clear selections after creation
      setSelectedTimeSlots([]);
    } finally {
      setIsCreating(false);
    }
  };

  const handleTimeSlotToggle = (time: string) => {
    setSelectedTimeSlots(prev => 
      prev.includes(time) 
        ? prev.filter(t => t !== time)
        : [...prev, time]
    );
  };

  const handleSelectAll = () => {
    if (selectedTimeSlots.length === timeSlotOptions.length) {
      setSelectedTimeSlots([]);
    } else {
      setSelectedTimeSlots(timeSlotOptions.map(option => option.time));
    }
  };

  const handleToggleStatus = async (timeSlotId: Id<"timeSlots">) => {
    try {
      await toggleTimeSlotStatus({ timeSlotId });
      toast.success("Time slot status updated");
    } catch (error: any) {
      toast.error(error.message || "Failed to update time slot status");
    }
  };

  const handleDeleteTimeSlot = async (timeSlotId: Id<"timeSlots">) => {
    if (!confirm("Are you sure you want to delete this time slot?")) {
      return;
    }

    try {
      await deleteTimeSlot({ timeSlotId });
      toast.success("Time slot deleted successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to delete time slot");
    }
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString([], {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      {/* Create Time Slot Form */}
      <div className="bg-white rounded-lg border p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Create Time Slots</h2>
          <div className="flex gap-2">
            <button
              onClick={() => setShowMultiSelect(false)}
              className={`px-3 py-1 text-sm rounded ${
                !showMultiSelect
                  ? "bg-blue-100 text-blue-700"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Single
            </button>
            <button
              onClick={() => setShowMultiSelect(true)}
              className={`px-3 py-1 text-sm rounded ${
                showMultiSelect
                  ? "bg-blue-100 text-blue-700"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Multi-Select
            </button>
          </div>
        </div>

        {!showMultiSelect ? (
          // Single time slot creation
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
              <input
                type="time"
                value={selectedTime}
                onChange={(e) => setSelectedTime(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Duration (minutes)</label>
              <select
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={15}>15 minutes</option>
                <option value={30}>30 minutes</option>
                <option value={45}>45 minutes</option>
                <option value={60}>60 minutes</option>
                <option value={90}>90 minutes</option>
                <option value={120}>120 minutes</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={handleCreateTimeSlot}
                disabled={isCreating}
                className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isCreating ? "Creating..." : "Create Slot"}
              </button>
            </div>
          </div>
        ) : (
          // Multi-select time slot creation
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => {
                    setSelectedDate(e.target.value);
                    setSelectedTimeSlots([]); // Clear selections when date changes
                  }}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Duration (minutes)</label>
                <select
                  value={duration}
                  onChange={(e) => {
                    setDuration(Number(e.target.value));
                    setSelectedTimeSlots([]); // Clear selections when duration changes
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value={15}>15 minutes</option>
                  <option value={30}>30 minutes</option>
                  <option value={45}>45 minutes</option>
                  <option value={60}>60 minutes</option>
                  <option value={90}>90 minutes</option>
                  <option value={120}>120 minutes</option>
                </select>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-3">
                <label className="block text-sm font-medium text-gray-700">
                  Select Time Slots ({selectedTimeSlots.length} selected)
                </label>
                <button
                  onClick={handleSelectAll}
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  {selectedTimeSlots.length === timeSlotOptions.length ? "Deselect All" : "Select All"}
                </button>
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 max-h-64 overflow-y-auto border border-gray-200 rounded-md p-3">
                {timeSlotOptions.map((option) => (
                  <label
                    key={option.time}
                    className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-2 rounded"
                  >
                    <input
                      type="checkbox"
                      checked={selectedTimeSlots.includes(option.time)}
                      onChange={() => handleTimeSlotToggle(option.time)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">{option.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={handleCreateMultipleTimeSlots}
                disabled={isCreating || selectedTimeSlots.length === 0}
                className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isCreating ? "Creating..." : `Create ${selectedTimeSlots.length} Slot${selectedTimeSlots.length !== 1 ? 's' : ''}`}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Time Slots List */}
      <div className="bg-white rounded-lg border">
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">Your Time Slots</h2>
          <p className="text-sm text-gray-600 mt-1">
            Manage your available time slots. These can be assigned to meetings.
          </p>
        </div>

        {timeSlots.length === 0 ? (
          <div className="p-6 text-center">
            <p className="text-gray-500">No time slots created yet</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {timeSlots.map((slot) => (
              <div key={slot._id} className="p-6 flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-4">
                    <div>
                      <p className="font-medium text-gray-900">
                        {formatDateTime(slot.start)} - {formatDateTime(slot.end)}
                      </p>
                      <p className="text-sm text-gray-500">
                        Duration: {slot.duration} minutes
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          slot.isActive
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {slot.isActive ? "Active" : "Inactive"}
                      </span>
                      {slot.isBooked && (
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          Booked
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggleStatus(slot._id)}
                    className="text-sm text-blue-600 hover:text-blue-700"
                  >
                    {slot.isActive ? "Deactivate" : "Activate"}
                  </button>
                  {!slot.isBooked && (
                    <button
                      onClick={() => handleDeleteTimeSlot(slot._id)}
                      className="text-sm text-red-600 hover:text-red-700"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
