"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import React, { useState, useEffect, useMemo } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { getBookingsForDateRange, createBooking, cancelBooking } from "@/app/actions"
import { addDays, format, subDays, isSameDay, isSameMonth, startOfMonth, endOfMonth, startOfWeek, endOfWeek } from "date-fns"
import { ChevronLeft, ChevronRight, MoreVertical } from "lucide-react"
import * as DropdownMenu from "@radix-ui/react-dropdown-menu"

interface BookingCalendarProps {
  startDate: Date
  endDate: Date
  spaces: any[]
  foodTruck?: any
  onBookClick: (spaceId: string, timeSlot: any, date: Date) => void
  onCancelClick?: (bookingId: string) => void
  maxDaysAhead: number
}

// Define time slots (two slots per day, cutoff at 15:00)
const TIME_SLOTS = [
  { label: "Morning (08:00 - 15:00)", start: "08:00", end: "15:00" },
  { label: "Evening (15:00 - 22:00)", start: "15:00", end: "22:00" },
]

export function BookingCalendar({ 
  startDate, 
  endDate, 
  spaces,
  foodTruck,
  onBookClick,
  onCancelClick,
  maxDaysAhead
}: BookingCalendarProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [bookings, setBookings] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [currentMonth, setCurrentMonth] = useState(() => startOfMonth(new Date()))
  
  // Calculate calendar days for the month view
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth)
    const monthEnd = endOfMonth(monthStart)
    const calendarStart = startOfWeek(monthStart)
    const calendarEnd = endOfWeek(monthEnd)
    
    let day = calendarStart
    const days: Array<{
      date: string;
      isCurrentMonth: boolean;
      isToday: boolean;
      isSelected: boolean;
      isPast: boolean;
      isFuture: boolean;
      dayOfMonth: string;
      fullDate: Date;
    }> = []
    
    while (day <= calendarEnd) {
      days.push({
        date: format(day, 'yyyy-MM-dd'),
        isCurrentMonth: isSameMonth(day, monthStart),
        isToday: isSameDay(day, new Date()),
        isSelected: isSameDay(day, selectedDate),
        isPast: day < startOfDay(new Date()),
        isFuture: day > addDays(new Date(), maxDaysAhead),
        dayOfMonth: format(day, 'd'),
        fullDate: new Date(day)
      })
      day = addDays(day, 1)
    }
    
    return days
  }, [currentMonth, selectedDate, maxDaysAhead])
  
  // Query client for React Query
  const queryClient = useQueryClient()
  
  // Fetch bookings data for the selected date
  const bookingsQuery = useQuery({
    queryKey: ['bookings', selectedDate.toISOString()],
    queryFn: async () => {
      // For the selected day, we want bookings for the whole day
      const startDatetime = new Date(selectedDate)
      startDatetime.setHours(0, 0, 0, 0)
      
      const endDatetime = new Date(selectedDate)
      endDatetime.setHours(23, 59, 59, 999)
      
      const result = await getBookingsForDateRange(
        startDatetime.toISOString(), 
        endDatetime.toISOString()
      )
      
      if (!result.success) {
        throw new Error(result.error || "Failed to load bookings")
      }
      
      return result.data || []
    },
    staleTime: 30000, // 30 seconds
    refetchOnWindowFocus: true
  })
  
  // Helper function to get slot times in UTC
  const getSlotTimes = useMemo(() => {
    return (timeSlot: any, date: Date) => {
      const dateStr = format(date, 'yyyy-MM-dd')
      
      // Parse time components
      const [startHours, startMinutes] = timeSlot.start.split(':').map(Number)
      const [endHours, endMinutes] = timeSlot.end.split(':').map(Number)
      
      // Create dates in UTC
      const startDate = new Date(Date.UTC(
        date.getFullYear(),
        date.getMonth(),
        date.getDate(),
        startHours,
        startMinutes,
        0
      ))
      
      const endDate = new Date(Date.UTC(
        date.getFullYear(),
        date.getMonth(),
        date.getDate(),
        endHours,
        endMinutes,
        0
      ))
      
      return {
        start: startDate,
        end: endDate
      };
    };
  }, []);
  
  // Get bookings from query - using a stable callback to prevent infinite loops
  const updateBookingsState = useMemo(() => {
    return () => {
      if (bookingsQuery.isLoading) {
        setIsLoading(true)
      } else {
        setIsLoading(false)
        
        if (bookingsQuery.isError) {
          setError(bookingsQuery.error instanceof Error ? bookingsQuery.error.message : "Failed to load bookings")
        } else if (bookingsQuery.data) {
          // Only update if the data has changed to prevent unnecessary re-renders
          if (JSON.stringify(bookings) !== JSON.stringify(bookingsQuery.data)) {
            setBookings(bookingsQuery.data)
            setError("")
          }
        }
      }
    }
  }, [bookingsQuery.isLoading, bookingsQuery.isError, bookingsQuery.data, bookingsQuery.error, bookings])
  
  // Apply the update effect
  useEffect(() => {
    updateBookingsState()
  }, [updateBookingsState])
  
  // Update the local state immediately for optimistic UI updates
  const addBookingToLocalState = (spaceId: string, timeSlot: any, date: Date, foodTruckId: string) => {
    // Get slot times using our memoized helper
    const { start: slotStart, end: slotEnd } = getSlotTimes(timeSlot, date)
    
    const tempBooking = {
      id: `temp-${Date.now()}`,
      space: { id: spaceId },
      foodtruck: { id: foodTruckId },
      start: slotStart.toISOString(),
      end: slotEnd.toISOString()
    }
    
    // Add the temporary booking to the local state
    setBookings(prevBookings => [...prevBookings, tempBooking])
  }
  
  // Remove a booking from local state (for cancellation)
  const removeBookingFromLocalState = (bookingId: string) => {
    setBookings(prevBookings => prevBookings.filter(booking => booking.id !== bookingId))
  }
  
  // Check if a slot is already booked
  const isSlotBooked = (spaceId: string, timeSlot: any, date: Date) => {
    // Get slot times using our memoized helper
    const { start: slotStart, end: slotEnd } = getSlotTimes(timeSlot, date)
    
    // Special case for debugging - log info for specific time slots
    if (timeSlot.start === "04:00" && timeSlot.end === "09:00") {
      console.log("Checking 04:00-09:00 slot:", {
        date: date.toISOString(),
        slotStartISO: slotStart.toISOString(),
        slotEndISO: slotEnd.toISOString()
      })
    }
    
    if (timeSlot.start === "09:00" && timeSlot.end === "21:00") {
      console.log("Checking 09:00-21:00 slot:", {
        date: date.toISOString(),
        slotStartISO: slotStart.toISOString(),
        slotEndISO: slotEnd.toISOString()
      })
    }
    
    // Check if any booking overlaps with this time slot
    return bookings.some(booking => {
      if (booking.space.id !== spaceId) return false
      
      const bookingStart = new Date(booking.start)
      const bookingEnd = new Date(booking.end)
      
      // Log bookings for debugging adjacent slots issue
      if (timeSlot.start === "04:00" && timeSlot.end === "09:00") {
        console.log("Checking booking for 04:00-09:00 slot:", {
          bookingStart: bookingStart.toISOString(),
          bookingEnd: bookingEnd.toISOString()
        })
      }
      
      // Precise overlap check using string comparison for exact minute accuracy
      const slotStartTime = slotStart.toISOString().split('.')[0] // Format: "2023-04-25T09:00:00"
      const slotEndTime = slotEnd.toISOString().split('.')[0]
      const bookingStartTime = bookingStart.toISOString().split('.')[0]
      const bookingEndTime = bookingEnd.toISOString().split('.')[0]
      
      // For debugging - if this is our special case slots
      if (timeSlot.start === "04:00" && timeSlot.end === "09:00") {
        console.log("Time strings:", {
          slotStartTime,
          slotEndTime,
          bookingStartTime,
          bookingEndTime,
          isAdjacentStart: slotEndTime === bookingStartTime,
          isAdjacentEnd: bookingEndTime === slotStartTime
        })
      }
      
      // Careful comparison - if slot end EXACTLY equals booking start, they don't overlap
      // Similarly if booking end EXACTLY equals slot start, they don't overlap
      if (slotEndTime === bookingStartTime || bookingEndTime === slotStartTime) {
        return false
      }
      
      // Standard overlap check
      const hasOverlap = bookingStart < slotEnd && bookingEnd > slotStart
      
      // Log the decision for our debugging case
      if (timeSlot.start === "04:00" && timeSlot.end === "09:00" && hasOverlap) {
        console.log("04:00-09:00 slot is marked as booked due to overlap")
      }
      
      return hasOverlap
    })
  }
  
  // Check if the slot is booked by current user's food truck
  const isSlotBookedByMe = (spaceId: string, timeSlot: any, date: Date) => {
    if (!foodTruck) return false
    
    // Get slot times using our memoized helper
    const { start: slotStart, end: slotEnd } = getSlotTimes(timeSlot, date)
    
    // Find booking that overlaps with this time slot and belongs to current user
    const myBooking = bookings.find(booking => {
      if (booking.space.id !== spaceId) return false
      
      // Check if this is my booking
      if (!booking.foodtruck || !foodTruck) return false;
      
      // Check if temporary booking or real booking
      const isMyBooking = booking.foodtruck.id === foodTruck.id || 
                         (typeof booking.foodtruck.id === 'string' && 
                          booking.foodtruck.id === foodTruck.id.toString());
      
      if (!isMyBooking) return false;
      
      const bookingStart = new Date(booking.start)
      const bookingEnd = new Date(booking.end)
      
      // Precise overlap check using string comparison for exact second accuracy
      const slotStartTime = slotStart.toISOString().split('.')[0] // Format: "2023-04-25T09:00:00"
      const slotEndTime = slotEnd.toISOString().split('.')[0]
      const bookingStartTime = bookingStart.toISOString().split('.')[0]
      const bookingEndTime = bookingEnd.toISOString().split('.')[0]
      
      // Careful comparison - if slot end EXACTLY equals booking start, they don't overlap
      // Similarly if booking end EXACTLY equals slot start, they don't overlap
      if (slotEndTime === bookingStartTime || bookingEndTime === slotStartTime) {
        return false
      }
      
      // Otherwise check for any overlap (using timestamps for comparison)
      return (bookingStart < slotEnd && bookingEnd > slotStart)
    })
    
    return !!myBooking ? myBooking.id : false
  }
  
  // Get the booking ID for a slot
  const getBookingId = (spaceId: string, timeSlot: any, date: Date) => {
    // Get slot times using our memoized helper
    const { start: slotStart, end: slotEnd } = getSlotTimes(timeSlot, date)
    
    // Find booking that overlaps with this time slot
    const booking = bookings.find(booking => {
      if (booking.space.id !== spaceId) return false
      
      const bookingStart = new Date(booking.start)
      const bookingEnd = new Date(booking.end)
      
      // Precise overlap check using string comparison for exact second accuracy
      const slotStartTime = slotStart.toISOString().split('.')[0] // Format: "2023-04-25T09:00:00"
      const slotEndTime = slotEnd.toISOString().split('.')[0]
      const bookingStartTime = bookingStart.toISOString().split('.')[0]
      const bookingEndTime = bookingEnd.toISOString().split('.')[0]
      
      // Debug output if this is the problematic 04:00-09:00 slot
      if (timeSlot.start === "04:00" && timeSlot.end === "09:00") {
        console.log("getBookingId - Time strings:", {
          slotStartTime,
          slotEndTime,
          bookingStartTime,
          bookingEndTime,
          isAdjacentStart: slotEndTime === bookingStartTime,
          isAdjacentEnd: bookingEndTime === slotStartTime
        })
      }
      
      // Careful comparison - if slot end EXACTLY equals booking start, they don't overlap
      // Similarly if booking end EXACTLY equals slot start, they don't overlap
      if (slotEndTime === bookingStartTime || bookingEndTime === slotStartTime) {
        return false
      }
      
      // Otherwise check for any overlap (using timestamps for comparison)
      return (bookingStart < slotEnd && bookingEnd > slotStart)
    })
    
    return booking ? booking.id : null
  }
  
  // Get the business name for a booked slot
  const getBusinessName = (spaceId: string, timeSlot: any, date: Date) => {
    // Get slot times using our memoized helper
    const { start: slotStart, end: slotEnd } = getSlotTimes(timeSlot, date)
    
    // Find booking that overlaps with this time slot
    const booking = bookings.find(booking => {
      if (booking.space.id !== spaceId) return false
      
      const bookingStart = new Date(booking.start)
      const bookingEnd = new Date(booking.end)
      
      // Precise overlap check using string comparison for exact second accuracy
      const slotStartTime = slotStart.toISOString().split('.')[0] // Format: "2023-04-25T09:00:00"
      const slotEndTime = slotEnd.toISOString().split('.')[0]
      const bookingStartTime = bookingStart.toISOString().split('.')[0]
      const bookingEndTime = bookingEnd.toISOString().split('.')[0]
      
      // Debug output if this is the problematic 04:00-09:00 slot
      if (timeSlot.start === "04:00" && timeSlot.end === "09:00") {
        console.log("getBusinessName - Time strings:", {
          slotStartTime,
          slotEndTime,
          bookingStartTime,
          bookingEndTime,
          isAdjacentStart: slotEndTime === bookingStartTime,
          isAdjacentEnd: bookingEndTime === slotStartTime
        })
      }
      
      // Careful comparison - if slot end EXACTLY equals booking start, they don't overlap
      // Similarly if booking end EXACTLY equals slot start, they don't overlap
      if (slotEndTime === bookingStartTime || bookingEndTime === slotStartTime) {
        return false
      }
      
      // Otherwise check for any overlap (using timestamps for comparison)
      return (bookingStart < slotEnd && bookingEnd > slotStart)
    })
    
    return booking?.foodtruck?.name || "Another vendor"
  }
  
  // Navigation functions
  const previousMonth = () => {
    setCurrentMonth(prevMonth => subDays(prevMonth, 30))
  }
  
  const nextMonth = () => {
    setCurrentMonth(prevMonth => addDays(prevMonth, 30))
  }
  
  const selectDate = (date: Date) => {
    setSelectedDate(date)
  }
  
  // Helper for calendar day rendering
  const getDayClass = (day: any) => {
    return [
      "mx-auto flex size-8 items-center justify-center rounded-full",
      day.isSelected && day.isToday && "bg-indigo-600 text-white",
      day.isSelected && !day.isToday && "bg-gray-900 text-white",
      !day.isSelected && day.isToday && "text-indigo-600",
      !day.isSelected && !day.isToday && day.isCurrentMonth && "text-gray-900",
      !day.isSelected && !day.isToday && !day.isCurrentMonth && "text-gray-400",
      !day.isSelected && "hover:bg-gray-200",
      day.isPast && "opacity-50 cursor-not-allowed",
      day.isFuture && "opacity-50 cursor-not-allowed",
      (day.isSelected || day.isToday) && "font-semibold"
    ].filter(Boolean).join(" ")
  }
  
  // Helper to convert Date to midnight in UTC to avoid timezone issues
  function startOfDay(date: Date): Date {
    return new Date(Date.UTC(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
      0, 0, 0
    ))
  }
  
  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-8 flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent align-[-0.125em]"></div>
            <p className="mt-2 text-sm text-muted-foreground">Loading calendar...</p>
          </div>
        </CardContent>
      </Card>
    )
  }
  
  return (
    <Card>
      <CardContent className="p-0 overflow-hidden">
        <div className="lg:flex lg:h-full lg:flex-col">
          <header className="flex items-center justify-between border-b border-gray-200 px-6 py-4 lg:flex-none">
            <h1 className="text-lg font-semibold text-gray-900">
              {format(currentMonth, 'MMMM yyyy')}
            </h1>
            <div className="flex items-center">
              <div className="relative flex items-center md:items-stretch">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={previousMonth}
                  className="h-8 w-8 rounded-l-md rounded-r-none border-r-0"
                >
                  <span className="sr-only">Previous month</span>
                  <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentMonth(startOfMonth(new Date()))}
                  className="hidden md:block h-8 rounded-none border-x-0 px-2"
                >
                  Today
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={nextMonth}
                  disabled={addDays(currentMonth, 30) > addDays(new Date(), maxDaysAhead)}
                  className="h-8 w-8 rounded-r-md rounded-l-none border-l-0"
                >
                  <span className="sr-only">Next month</span>
                  <ChevronRight className="h-4 w-4" aria-hidden="true" />
                </Button>
              </div>
            </div>
          </header>
        <div className="shadow ring-1 ring-black/5 lg:flex lg:flex-auto lg:flex-col">
          <div className="grid grid-cols-7 gap-px border-b border-gray-200 bg-gray-100 text-center text-xs font-semibold text-gray-700">
            <div className="py-2">Mon</div>
            <div className="py-2">Tue</div>
            <div className="py-2">Wed</div>
            <div className="py-2">Thu</div>
            <div className="py-2">Fri</div>
            <div className="py-2">Sat</div>
            <div className="py-2">Sun</div>
          </div>
          <div className="flex bg-gray-100 text-xs leading-6 text-gray-700 lg:flex-auto">
            <div className="grid w-full grid-cols-7 gap-px">
              {calendarDays.map((day) => (
                <div
                  key={day.date}
                  className={`${
                    day.isCurrentMonth ? 'bg-white' : 'bg-gray-50 text-gray-500'
                  } relative px-3 py-2`}
                >
                  <button
                    type="button"
                    onClick={() => !day.isPast && !day.isFuture && selectDate(day.fullDate)}
                    disabled={day.isPast || day.isFuture}
                    className={getDayClass(day)}
                  >
                    <time dateTime={day.date}>{day.dayOfMonth}</time>
                  </button>
                  {day.isFuture && (
                    <div className="absolute bottom-1 right-1">
                      <span className="h-1 w-1 rounded-full bg-red-400" title={`Booking not allowed: more than ${maxDaysAhead} days ahead`}></span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
        
        <section className="mt-8 p-4">
          <h2 className="text-base font-semibold text-gray-900">
            Schedule for <time dateTime={format(selectedDate, 'yyyy-MM-dd')}>{format(selectedDate, 'MMMM d, yyyy')}</time>
          </h2>
        
        {selectedDate > addDays(new Date(), maxDaysAhead) ? (
          <div className="mt-4 rounded-md bg-yellow-50 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">Booking Restrictions</h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p>Bookings can only be made up to {maxDaysAhead} days in advance.</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-4 grid gap-4 md:grid-cols-1 lg:grid-cols-2">
            {spaces.flatMap((space) => 
              TIME_SLOTS.map((timeSlot, timeSlotIndex) => {
                // Debug information for time slots
                if (timeSlot.start === "04:00" || timeSlot.start === "09:00") {
                  console.log(`Checking slot availability for ${timeSlot.start}-${timeSlot.end}...`);
                }
                
                const isBooked = isSlotBooked(space.id, timeSlot, selectedDate);
                const isMyBooking = isSlotBookedByMe(space.id, timeSlot, selectedDate);
                const bookingId = getBookingId(space.id, timeSlot, selectedDate);
                const businessName = getBusinessName(space.id, timeSlot, selectedDate);
                
                // More debugging info for slot status
                if (timeSlot.start === "04:00" || timeSlot.start === "09:00") {
                  console.log(`Slot ${timeSlot.start}-${timeSlot.end} status:`, { 
                    isBooked, 
                    isMyBooking,
                    bookingId
                  });
                }
                
                return (
                  <div
                    key={`${space.id}-${timeSlotIndex}`}
                    className={`group flex items-center gap-x-4 rounded-xl border p-4 ${
                      isMyBooking ? 'bg-green-50 border-green-200' : 
                      isBooked ? 'bg-red-50 border-red-200' : 
                      'bg-blue-50 border-blue-200 hover:bg-blue-100'
                    }`}
                  >
                    <div className={`size-10 flex-none rounded-full flex items-center justify-center text-xs font-medium ${
                      isMyBooking ? 'bg-green-100 text-green-800' : 
                      isBooked ? 'bg-red-100 text-red-800' : 
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {isMyBooking ? 'You' : isBooked ? 'Booked' : 'Open'}
                    </div>
                    <div className="flex-auto">
                      <p className="font-medium">{space.name}</p>
                      <p className="text-sm text-gray-600">
                        <time>{timeSlot.start}</time> - <time>{timeSlot.end}</time>
                        {isBooked && !isMyBooking && (
                          <span className="ml-2 text-xs font-medium">(by {businessName})</span>
                        )}
                      </p>
                    </div>
                    
                    <div className="ml-4">
                      {isMyBooking ? (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => {
                            // Update UI immediately
                            removeBookingFromLocalState(bookingId);
                            
                            // Only attempt to cancel non-temporary bookings
                            if (onCancelClick && !bookingId.toString().startsWith('temp-')) {
                              onCancelClick(bookingId);
                            }
                          }}
                        >
                          Cancel
                        </Button>
                      ) : !isBooked && (
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => {
                            // Update UI immediately
                            if (foodTruck) {
                              addBookingToLocalState(space.id, timeSlot, selectedDate, foodTruck.id);
                            }
                            // Call the actual booking function
                            onBookClick(space.id, timeSlot, selectedDate);
                          }}
                        >
                          Book
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </section>
        </div>
      </CardContent>
    </Card>
  )
}