"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { addDays, startOfWeek, format, addWeeks, isSameDay } from "date-fns"
import { ChevronLeft, ChevronRight } from "lucide-react"

interface DateRangePickerProps {
  startDate: Date
  endDate: Date
  onChange: (startDate: Date, endDate: Date) => void
  maxDaysAhead: number
}

export function DateRangePicker({ 
  startDate, 
  endDate, 
  onChange, 
  maxDaysAhead 
}: DateRangePickerProps) {
  const [weekOffset, setWeekOffset] = useState(0)
  
  // Get the current week's start date (Sunday)
  const baseStartOfWeek = startOfWeek(new Date(), { weekStartsOn: 1 }) // Start on Monday
  
  // Calculate visible week start based on offset
  const visibleWeekStart = addWeeks(baseStartOfWeek, weekOffset)
  
  // Generate array of dates for the week
  const weekDates = Array.from({ length: 7 }, (_, i) => addDays(visibleWeekStart, i))
  
  // Check if a week is selectable (within allowed range)
  const canSelectNextWeek = () => {
    const lastAllowedDate = addDays(new Date(), maxDaysAhead)
    const nextWeekStart = addWeeks(visibleWeekStart, 1)
    return nextWeekStart <= lastAllowedDate
  }

  const isSelectedDate = (date: Date) => {
    return date >= startDate && date <= endDate
  }
  
  const isToday = (date: Date) => {
    return isSameDay(date, new Date())
  }
  
  const handleDateClick = (date: Date) => {
    if (date > addDays(new Date(), maxDaysAhead)) return // Don't allow dates beyond max allowed
    
    // If clicking the same date or a date in the selected range
    if (isSelectedDate(date)) {
      // Just select this single date
      onChange(date, date)
    } else if (date < startDate) {
      // If clicking before current start, set as new start
      onChange(date, endDate)
    } else {
      // If clicking after current end, set as new end
      onChange(startDate, date)
    }
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-md font-semibold">Select Date Range</CardTitle>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setWeekOffset(prev => Math.max(prev - 1, 0))}
              disabled={weekOffset === 0}
              className="h-8 w-8"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setWeekOffset(prev => prev + 1)}
              disabled={!canSelectNextWeek()}
              className="h-8 w-8"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-1">
          {weekDates.map((date, index) => {
            const isDisabled = date > addDays(new Date(), maxDaysAhead) || date < new Date()
            const isSelected = isSelectedDate(date)
            
            return (
              <div key={index} className="text-center">
                <div className="mb-1 text-xs text-muted-foreground">
                  {format(date, 'EEE')}
                </div>
                <Button
                  variant={isSelected 
                    ? "default" 
                    : isToday(date)
                      ? "outline"
                      : "ghost"
                  }
                  className={`w-full h-10 ${isSelected ? 'bg-primary' : ''} ${isToday(date) && !isSelected ? 'border-primary border' : ''}`}
                  onClick={() => handleDateClick(date)}
                  disabled={isDisabled}
                >
                  <time dateTime={format(date, 'yyyy-MM-dd')}>
                    {format(date, 'd')}
                  </time>
                </Button>
              </div>
            )
          })}
        </div>
        <div className="mt-3 text-sm text-muted-foreground text-center">
          {format(startDate, 'MMM d, yyyy')} – {format(endDate, 'MMM d, yyyy')}
        </div>
      </CardContent>
    </Card>
  )
}