import { useState } from "react";

interface TimeSlot {
  start: Date;
  end: Date;
}

interface TimeSlotPickerProps {
  duration: number;
  selectedSlots?: TimeSlot[];
  availableSlots?: TimeSlot[];
  bookedSlots?: TimeSlot[];
  userBookedSlot?: TimeSlot | null;
  selectedSlot?: TimeSlot | null;
  onSlotsChange?: (slots: TimeSlot[]) => void;
  onSlotSelect?: (slot: TimeSlot | null) => void;
  mode?: "creation" | "booking";
}

export function TimeSlotPicker({
  duration,
  selectedSlots = [],
  availableSlots = [],
  bookedSlots = [],
  userBookedSlot = null,
  selectedSlot = null,
  onSlotsChange,
  onSlotSelect,
  mode = "creation"
}: TimeSlotPickerProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedTime, setSelectedTime] = useState("09:00");

  // Generate time slots for a day (9 AM to 5 PM in 30-minute intervals)
  const generateTimeSlots = (date: string) => {
    const slots: TimeSlot[] = [];
    const baseDate = new Date(date + 'T00:00:00');
    
    for (let hour = 9; hour < 17; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const start = new Date(baseDate);
        start.setHours(hour, minute, 0, 0);
        
        const end = new Date(start);
        end.setMinutes(end.getMinutes() + duration);
        
        // Don't show slots that would end after 5 PM
        if (end.getHours() <= 17) {
          slots.push({ start, end });
        }
      }
    }
    
    return slots;
  };

  const timeSlots = generateTimeSlots(selectedDate);

  const addTimeSlot = () => {
    const [hours, minutes] = selectedTime.split(':').map(Number);
    const start = new Date(selectedDate + 'T00:00:00');
    start.setHours(hours, minutes, 0, 0);
    
    const end = new Date(start);
    end.setMinutes(end.getMinutes() + duration);
    
    const newSlot = { start, end };
    
    // Check if slot already exists
    const exists = selectedSlots.some(slot => 
      slot.start.getTime() === newSlot.start.getTime()
    );
    
    if (!exists && onSlotsChange) {
      onSlotsChange([...selectedSlots, newSlot]);
    }
  };

  const removeTimeSlot = (slotToRemove: TimeSlot) => {
    if (onSlotsChange) {
      onSlotsChange(selectedSlots.filter(slot => 
        slot.start.getTime() !== slotToRemove.start.getTime()
      ));
    }
  };

  const isSlotSelected = (slot: TimeSlot) => {
    return selectedSlots.some(s => s.start.getTime() === slot.start.getTime());
  };

  const isSlotAvailable = (slot: TimeSlot) => {
    return availableSlots.some(s => s.start.getTime() === slot.start.getTime());
  };

  const isSlotBooked = (slot: TimeSlot) => {
    return bookedSlots.some(s => s.start.getTime() === slot.start.getTime());
  };

  const isSlotUserBooked = (slot: TimeSlot) => {
    return userBookedSlot && userBookedSlot.start.getTime() === slot.start.getTime();
  };

  const isSlotCurrentlySelected = (slot: TimeSlot) => {
    return selectedSlot && selectedSlot.start.getTime() === slot.start.getTime();
  };

  const handleSlotClick = (slot: TimeSlot) => {
    if (mode === "creation") {
      if (isSlotSelected(slot)) {
        removeTimeSlot(slot);
      } else {
        if (onSlotsChange) {
          onSlotsChange([...selectedSlots, slot]);
        }
      }
    } else if (mode === "booking") {
      if (isSlotAvailable(slot) && !isSlotBooked(slot) && onSlotSelect) {
        onSlotSelect(isSlotCurrentlySelected(slot) ? null : slot);
      }
    }
  };

  const getSlotButtonClass = (slot: TimeSlot) => {
    const baseClass = "px-3 py-2 text-sm rounded border transition-colors cursor-pointer";
    
    if (mode === "creation") {
      if (isSlotSelected(slot)) {
        return `${baseClass} bg-blue-600 text-white border-blue-600`;
      }
      return `${baseClass} bg-white text-gray-700 border-gray-300 hover:bg-gray-50`;
    } else {
      if (isSlotUserBooked(slot)) {
        return `${baseClass} bg-green-600 text-white border-green-600`;
      }
      if (isSlotBooked(slot)) {
        return `${baseClass} bg-gray-400 text-white border-gray-400 cursor-not-allowed`;
      }
      if (isSlotCurrentlySelected(slot)) {
        return `${baseClass} bg-blue-600 text-white border-blue-600`;
      }
      if (isSlotAvailable(slot)) {
        return `${baseClass} bg-white text-gray-700 border-gray-300 hover:bg-blue-50 hover:border-blue-300`;
      }
      return `${baseClass} bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed`;
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Get next 7 days for date selection
  const getNextDays = (count: number) => {
    const days = [];
    const today = new Date();
    
    for (let i = 0; i < count; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      days.push(date);
    }
    
    return days;
  };

  const nextDays = getNextDays(7);

  return (
    <div className="space-y-4">
      {mode === "creation" && (
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-3">Add Time Slots</h4>
          <div className="flex gap-2 items-end">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Date</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="px-3 py-2 border border-gray-300 rounded text-sm"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Time</label>
              <input
                type="time"
                value={selectedTime}
                onChange={(e) => setSelectedTime(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded text-sm"
              />
            </div>
            <button
              type="button"
              onClick={addTimeSlot}
              className="px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
            >
              Add Slot
            </button>
          </div>
        </div>
      )}

      <div>
        <div className="flex gap-2 mb-4 overflow-x-auto">
          {nextDays.map((day) => {
            const dateStr = day.toISOString().split('T')[0];
            const isSelected = selectedDate === dateStr;
            
            return (
              <button
                key={dateStr}
                onClick={() => setSelectedDate(dateStr)}
                className={`px-3 py-2 text-sm rounded whitespace-nowrap ${
                  isSelected
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {day.toLocaleDateString([], { 
                  weekday: 'short', 
                  month: 'short', 
                  day: 'numeric' 
                })}
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
          {timeSlots.map((slot, index) => (
            <button
              key={index}
              onClick={() => handleSlotClick(slot)}
              className={getSlotButtonClass(slot)}
              disabled={
                mode === "booking" && 
                (!isSlotAvailable(slot) || (isSlotBooked(slot) && !isSlotUserBooked(slot)))
              }
            >
              {formatTime(slot.start)}
            </button>
          ))}
        </div>
      </div>

      {mode === "creation" && selectedSlots.length > 0 && (
        <div>
          <h4 className="font-medium text-gray-900 mb-2">Selected Slots ({selectedSlots.length})</h4>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {selectedSlots
              .sort((a, b) => a.start.getTime() - b.start.getTime())
              .map((slot, index) => (
                <div key={index} className="flex justify-between items-center bg-blue-50 px-3 py-2 rounded">
                  <span className="text-sm text-blue-900">
                    {slot.start.toLocaleDateString()} at {formatTime(slot.start)} - {formatTime(slot.end)}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeTimeSlot(slot)}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    Remove
                  </button>
                </div>
              ))}
          </div>
        </div>
      )}

      {mode === "booking" && (
        <div className="flex gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-white border border-gray-300 rounded"></div>
            <span>Available</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-gray-400 rounded"></div>
            <span>Booked</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-600 rounded"></div>
            <span>Your booking</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-600 rounded"></div>
            <span>Selected</span>
          </div>
        </div>
      )}
    </div>
  );
}
