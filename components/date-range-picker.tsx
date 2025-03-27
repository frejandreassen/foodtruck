"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { addDays, startOfWeek, format, addWeeks, isSameDay, endOfWeek } from "date-fns"
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
  
  // Get the current week's start date (Monday)
  const baseStartOfWeek = startOfWeek(new Date(), { weekStartsOn: 1 }) // Start on Monday
  
  // Calculate visible week start based on offset
  const visibleWeekStart = addWeeks(baseStartOfWeek, weekOffset)
  
  // Calculate visible week end (Sunday)
  const visibleWeekEnd = endOfWeek(visibleWeekStart, { weekStartsOn: 1 })
  
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
  
  useEffect(() => {
    // When weekOffset changes, update the date range to show the complete week
    // But only if the start or end dates are different from what we already have
    if (!isSameDay(startDate, visibleWeekStart) || !isSameDay(endDate, visibleWeekEnd)) {
      onChange(visibleWeekStart, visibleWeekEnd)
    }
  }, [weekOffset, onChange, visibleWeekStart, visibleWeekEnd, startDate, endDate])
  
  const handlePrevWeek = () => {
    if (weekOffset > 0) {
      setWeekOffset(prev => prev - 1)
    }
  }
  
  const handleNextWeek = () => {
    if (canSelectNextWeek()) {
      setWeekOffset(prev => prev + 1)
    }
  }
  
  const handleDateClick = (date: Date) => {
    if (date > addDays(new Date(), maxDaysAhead)) return // Don't allow dates beyond max allowed
    
    // Always select the entire week
    const clickedWeekStart = startOfWeek(date, { weekStartsOn: 1 })
    const clickedWeekEnd = endOfWeek(date, { weekStartsOn: 1 })
    onChange(clickedWeekStart, clickedWeekEnd)
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-md font-semibold">Week of {format(visibleWeekStart, 'MMM d')}</CardTitle>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="icon"
              onClick={handlePrevWeek}
              disabled={weekOffset === 0}
              className="h-8 w-8"
              aria-label="Previous week"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={handleNextWeek}
              disabled={!canSelectNextWeek()}
              className="h-8 w-8"
              aria-label="Next week"
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
          {format(startDate, 'MMM d')} – {format(endDate, 'MMM d, yyyy')} (Monday–Sunday)
        </div>
      </CardContent>
    </Card>
  )
}