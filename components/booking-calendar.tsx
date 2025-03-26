"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { format, parseISO } from "date-fns"
import { useState, useEffect } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { getBookingsForDateRange, createBooking, cancelBooking } from "@/app/actions"

interface BookingCalendarProps {
  startDate: Date
  endDate: Date
  spaces: any[]
  foodTruck?: any
  onBookClick: (spaceId: string, timeSlot: any, date: Date) => void
  onCancelClick?: (bookingId: string) => void
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
  onCancelClick 
}: BookingCalendarProps) {
  const [bookings, setBookings] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  
  // Generate array of dates for the range
  const dates: Date[] = []
  let currentDate = new Date(startDate)
  while (currentDate <= endDate) {
    dates.push(new Date(currentDate))
    currentDate.setDate(currentDate.getDate() + 1)
  }
  
  // Use react-query to fetch bookings
  const queryClient = useQueryClient()
  const bookingsQuery = useQuery({
    queryKey: ['bookings', startDate.toISOString(), endDate.toISOString()],
    queryFn: async () => {
      const startDateString = startDate.toISOString()
      const endDateString = endDate.toISOString()
      
      const result = await getBookingsForDateRange(startDateString, endDateString)
      if (!result.success) {
        throw new Error(result.error || "Failed to load bookings")
      }
      return result.data || []
    },
    staleTime: 30000, // 30 seconds
    refetchOnWindowFocus: true
  })
  
  // Create mutation for booking a slot
  const bookMutation = useMutation({
    mutationFn: async (bookingData: any) => {
      const result = await createBooking(bookingData)
      if (!result.success) {
        throw new Error(result.error || "Failed to create booking")
      }
      return result.data
    },
    onSuccess: () => {
      // Invalidate bookings query to refresh data
      queryClient.invalidateQueries({ queryKey: ['bookings'] })
    }
  })
  
  // Create mutation for cancelling a booking
  const cancelMutation = useMutation({
    mutationFn: async (bookingId: string) => {
      const result = await cancelBooking(bookingId)
      if (!result.success) {
        throw new Error(result.error || "Failed to cancel booking")
      }
      return result.data
    },
    onSuccess: () => {
      // Invalidate bookings query to refresh data
      queryClient.invalidateQueries({ queryKey: ['bookings'] })
    }
  })
  
  // Get bookings from query
  useEffect(() => {
    if (bookingsQuery.isLoading) {
      setIsLoading(true)
    } else {
      setIsLoading(false)
      
      if (bookingsQuery.isError) {
        setError(bookingsQuery.error instanceof Error ? bookingsQuery.error.message : "Failed to load bookings")
      } else if (bookingsQuery.data) {
        setBookings(bookingsQuery.data)
        setError("")
      }
    }
  }, [bookingsQuery.isLoading, bookingsQuery.isError, bookingsQuery.data, bookingsQuery.error])
  
  // Check if a slot is already booked
  const isSlotBooked = (spaceId: string, timeSlot: any, date: Date) => {
    // Convert time strings to Date objects for the selected date
    const slotStart = new Date(date)
    const [startHours, startMinutes] = timeSlot.start.split(':').map(Number)
    slotStart.setHours(startHours, startMinutes, 0, 0)
    
    const slotEnd = new Date(date)
    const [endHours, endMinutes] = timeSlot.end.split(':').map(Number)
    slotEnd.setHours(endHours, endMinutes, 0, 0)
    
    // Check if any booking overlaps with this time slot
    return bookings.some(booking => {
      if (booking.space.id !== spaceId) return false
      
      const bookingStart = new Date(booking.start)
      const bookingEnd = new Date(booking.end)
      
      // Check for overlap
      return (
        (bookingStart <= slotEnd && bookingEnd >= slotStart) ||
        (slotStart <= bookingEnd && slotEnd >= bookingStart)
      )
    })
  }
  
  // Update the local state immediately for optimistic UI updates
  const addBookingToLocalState = (spaceId: string, timeSlot: any, date: Date, foodTruckId: string) => {
    // Create temporary booking for optimistic update
    const slotStart = new Date(date)
    const [startHours, startMinutes] = timeSlot.start.split(':').map(Number)
    slotStart.setHours(startHours, startMinutes, 0, 0)
    
    const slotEnd = new Date(date)
    const [endHours, endMinutes] = timeSlot.end.split(':').map(Number)
    slotEnd.setHours(endHours, endMinutes, 0, 0)
    
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
  
  // Check if the slot is booked by current user's food truck
  const isSlotBookedByMe = (spaceId: string, timeSlot: any, date: Date) => {
    if (!foodTruck) return false
    
    // Convert time strings to Date objects for the selected date
    const slotStart = new Date(date)
    const [startHours, startMinutes] = timeSlot.start.split(':').map(Number)
    slotStart.setHours(startHours, startMinutes, 0, 0)
    
    const slotEnd = new Date(date)
    const [endHours, endMinutes] = timeSlot.end.split(':').map(Number)
    slotEnd.setHours(endHours, endMinutes, 0, 0)
    
    // Find booking that overlaps with this time slot and belongs to current user
    const myBooking = bookings.find(booking => {
      if (booking.space.id !== spaceId) return false
      
      // Check if this is my booking
      if (!booking.foodtruck || !foodTruck || booking.foodtruck.id !== foodTruck.id) {
        return false
      }
      
      const bookingStart = new Date(booking.start)
      const bookingEnd = new Date(booking.end)
      
      // Check for overlap
      return (
        (bookingStart <= slotEnd && bookingEnd >= slotStart) ||
        (slotStart <= bookingEnd && slotEnd >= bookingStart)
      )
    })
    
    return !!myBooking ? myBooking.id : false
  }
  
  // Get the booking ID for a slot
  const getBookingId = (spaceId: string, timeSlot: any, date: Date) => {
    // Convert time strings to Date objects for the selected date
    const slotStart = new Date(date)
    const [startHours, startMinutes] = timeSlot.start.split(':').map(Number)
    slotStart.setHours(startHours, startMinutes, 0, 0)
    
    const slotEnd = new Date(date)
    const [endHours, endMinutes] = timeSlot.end.split(':').map(Number)
    slotEnd.setHours(endHours, endMinutes, 0, 0)
    
    // Find booking that overlaps with this time slot
    const booking = bookings.find(booking => {
      if (booking.space.id !== spaceId) return false
      
      const bookingStart = new Date(booking.start)
      const bookingEnd = new Date(booking.end)
      
      // Check for overlap
      return (
        (bookingStart <= slotEnd && bookingEnd >= slotStart) ||
        (slotStart <= bookingEnd && slotEnd >= bookingStart)
      )
    })
    
    return booking ? booking.id : null
  }
  
  // Get the business name for a booked slot
  const getBusinessName = (spaceId: string, timeSlot: any, date: Date) => {
    // Convert time strings to Date objects for the selected date
    const slotStart = new Date(date)
    const [startHours, startMinutes] = timeSlot.start.split(':').map(Number)
    slotStart.setHours(startHours, startMinutes, 0, 0)
    
    const slotEnd = new Date(date)
    const [endHours, endMinutes] = timeSlot.end.split(':').map(Number)
    slotEnd.setHours(endHours, endMinutes, 0, 0)
    
    // Find booking that overlaps with this time slot
    const booking = bookings.find(booking => {
      if (booking.space.id !== spaceId) return false
      
      const bookingStart = new Date(booking.start)
      const bookingEnd = new Date(booking.end)
      
      // Check for overlap
      return (
        (bookingStart <= slotEnd && bookingEnd >= slotStart) ||
        (slotStart <= bookingEnd && slotEnd >= bookingStart)
      )
    })
    
    return booking?.foodtruck?.name || "Another vendor"
  }

  if (isLoading) {
    return (
      <Card className="p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent align-[-0.125em]"></div>
          <p className="mt-2 text-sm text-muted-foreground">Loading calendar...</p>
        </div>
      </Card>
    )
  }
  
  return (
    <Card className="overflow-hidden">
      <div className="w-full overflow-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-muted/50">
              <th className="border p-3 text-left font-medium">Space</th>
              {dates.map(date => (
                <th key={date.toString()} className="border p-3 text-center font-medium w-1/7">
                  {format(date, 'EEE, MMM d')}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {spaces.map(space => 
              TIME_SLOTS.map((timeSlot, timeSlotIndex) => (
                <tr key={`${space.id}-${timeSlotIndex}`}>
                  <td className="border p-3 bg-muted/30">
                    <div className="font-medium">{space.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {timeSlot.label}
                    </div>
                  </td>
                  
                  {dates.map(date => {
                    const isBooked = isSlotBooked(space.id, timeSlot, date)
                    const bookingId = getBookingId(space.id, timeSlot, date)
                    const isMyBooking = isSlotBookedByMe(space.id, timeSlot, date)
                    const businessName = getBusinessName(space.id, timeSlot, date)
                    
                    return (
                      <td key={date.toString()} className="border p-1">
                        <div className={`h-16 flex items-center justify-center rounded p-1 ${
                          isMyBooking ? 'bg-green-100' : 
                          isBooked ? 'bg-red-50' : 
                          'bg-blue-50'
                        }`}>
                          <div className="text-center">
                            {isMyBooking ? (
                              <>
                                <div className="text-xs font-medium text-green-800">Your Booking</div>
                                {onCancelClick && (
                                  <Button 
                                    variant="destructive" 
                                    size="sm" 
                                    className="mt-1 text-xs px-2 py-0.5 h-auto"
                                    onClick={() => {
                                      // Update UI immediately
                                      removeBookingFromLocalState(bookingId);
                                      // Call the actual cancel function
                                      if (onCancelClick) {
                                        onCancelClick(bookingId);
                                      }
                                    }}
                                  >
                                    Cancel
                                  </Button>
                                )}
                              </>
                            ) : isBooked ? (
                              <>
                                <div className="text-xs font-medium text-red-800">Booked</div>
                                <div className="text-xs text-red-600">{businessName}</div>
                              </>
                            ) : (
                              <>
                                <div className="text-xs font-medium text-blue-800">Available</div>
                                <Button 
                                  variant="default" 
                                  size="sm" 
                                  className="mt-1 text-xs px-2 py-0.5 h-auto"
                                  onClick={() => {
                                    // Update UI immediately
                                    if (foodTruck) {
                                      addBookingToLocalState(space.id, timeSlot, date, foodTruck.id);
                                    }
                                    // Call the actual booking function
                                    onBookClick(space.id, timeSlot, date);
                                  }}
                                >
                                  Book
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                      </td>
                    )
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </Card>
  )
}