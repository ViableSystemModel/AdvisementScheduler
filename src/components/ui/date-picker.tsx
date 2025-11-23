"use client"

import * as React from "react"
import { ChevronDownIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Label } from "@/components/ui/label"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

export function DatePicker(props: {
  date?: Date
  onChange: (date?: Date) => void
  onBlur?: () => void
}) {
  const [open, setOpen] = React.useState(false)

  return (
    <Popover open={open} onOpenChange={(isOpen) => {
      setOpen(isOpen)
      if (!isOpen) {
        props.onBlur?.()
      }
    }}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          id="date"
          className="w-48 justify-between font-normal"
        >
          {props.date ? props.date.toLocaleDateString() : "Select date"}
          <ChevronDownIcon />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto overflow-hidden p-0" align="start">
        <Calendar
          mode="single"
          selected={props.date}
          captionLayout="dropdown"
          onSelect={(date) => {
            props.onChange(date)
            setOpen(false)
            props.onBlur?.()
          }}
        />
      </PopoverContent>
    </Popover>
  )
}
