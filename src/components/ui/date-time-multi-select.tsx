"use client"

import * as React from "react"
import { ChevronDownIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { Label } from "@/components/ui/label"

interface DateTimeMultiSelectProps {
  date?: Date
  times: string[] // Array of time strings in HH:MM format
  timezone: string
  minDate?: Date // Optional minimum selectable date
  maxDate?: Date // Optional maximum selectable date
  onDateChange: (date?: Date) => void
  onTimesChange: (times: string[]) => void
  onTimezoneChange: (timezone: string) => void
}

// Common US timezones
const TIMEZONES = [
  { value: 'America/New_York', label: 'Eastern Time' },
  { value: 'America/Chicago', label: 'Central Time' },
  { value: 'America/Denver', label: 'Mountain Time' },
  { value: 'America/Phoenix', label: 'Arizona Time' },
  { value: 'America/Los_Angeles', label: 'Pacific Time' },
  { value: 'America/Anchorage', label: 'Alaska Time' },
  { value: 'Pacific/Honolulu', label: 'Hawaii Time' },
]

// Generate all 15-minute time slots for a day
const generateTimeSlots = (): string[] => {
  const slots: string[] = []
  for (let hour = 0; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute += 15) {
      const h = hour.toString().padStart(2, '0')
      const m = minute.toString().padStart(2, '0')
      slots.push(`${h}:${m}`)
    }
  }
  return slots
}

const formatTimeSlot = (time: string): string => {
  const [hour, minute] = time.split(':').map(Number)
  const period = hour >= 12 ? 'PM' : 'AM'
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour
  return `${displayHour}:${minute.toString().padStart(2, '0')} ${period}`
}

export function DateTimeMultiSelect({
  date,
  times,
  timezone,
  minDate,
  maxDate,
  onDateChange,
  onTimesChange,
  onTimezoneChange,
}: DateTimeMultiSelectProps) {
  const [open, setOpen] = React.useState(false)
  const timeSlots = React.useMemo(() => generateTimeSlots(), [])

  const toggleTime = (time: string) => {
    if (times.includes(time)) {
      onTimesChange(times.filter(t => t !== time))
    } else {
      onTimesChange([...times, time].sort())
    }
  }

  const selectAll = () => {
    onTimesChange(timeSlots)
  }

  const clearAll = () => {
    onTimesChange([])
  }

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <Label>Timezone</Label>
        <Select value={timezone} onValueChange={onTimezoneChange}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TIMEZONES.map((tz) => (
              <SelectItem key={tz.value} value={tz.value}>
                {tz.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="w-full justify-between font-normal"
          >
            {date ? date.toLocaleDateString() : "Select date"}
            <ChevronDownIcon className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto overflow-hidden p-0" align="start">
          <Calendar
            mode="single"
            selected={date}
            captionLayout="dropdown"
            startMonth={minDate}
            endMonth={maxDate}
            onSelect={(selectedDate) => {
              onDateChange(selectedDate)
              setOpen(false)
            }}
          />
        </PopoverContent>
      </Popover>

      {date && (
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">
              {times.length} slot{times.length !== 1 ? 's' : ''} selected
            </span>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={selectAll}
              >
                Select All
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={clearAll}
              >
                Clear All
              </Button>
            </div>
          </div>

          <ScrollArea className="h-64 w-full rounded-md border p-3">
            <div className="grid grid-cols-4 gap-2">
              {timeSlots.map((time) => {
                const isSelected = times.includes(time)
                return (
                  <Button
                    key={time}
                    type="button"
                    variant={isSelected ? "default" : "outline"}
                    size="sm"
                    className={cn(
                      "text-xs font-mono",
                      isSelected && "bg-primary text-primary-foreground"
                    )}
                    onClick={() => toggleTime(time)}
                  >
                    {formatTimeSlot(time)}
                  </Button>
                )
              })}
            </div>
          </ScrollArea>
        </div>
      )}
    </div>
  )
}

