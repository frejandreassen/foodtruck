"use client"

import { useState, useEffect } from "react"
import { format, addDays } from "date-fns"
import { useRouter } from "next/navigation"
import { ProtectedRoute } from "@/components/protected-route"
import { SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Soup, Calendar as CalendarIcon, MapPin, User, Check, AlertCircle, X, PanelLeftIcon } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/lib/auth-context"
import { 
  getAllSpaces, 
  getBookingsForDateRange, 
  getUserFoodTruck, 
  createBooking,
  getBookingRules,
  getFoodTruckBookings
} from "@/app/actions"
import { BookingRules } from "@/components/booking-rules"

export default function BookingPage() {
  const { user, logout } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const today = new Date()
  const [date, setDate] = useState<Date | undefined>(today)
  const [spaces, setSpaces] = useState<any[]>([])
  const [bookings, setBookings] = useState<any[]>([])
  const [userFoodTruck, setUserFoodTruck] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [isBooking, setIsBooking] = useState(false)
  const [bookingSpace, setBookingSpace] = useState<any>(null)
  const [bookingTimeSlot, setBookingTimeSlot] = useState<any>(null)
  const [showBookingConfirm, setShowBookingConfirm] = useState(false)
  const [bookingRules, setBookingRules] = useState<null | {
    maximum_future_bookings: number;
    maximum_days_ahead: number;
    last_minute_booking_hours: number;
  }>(null)
  const [futureBookings, setFutureBookings] = useState(0)
  const [loadingRules, setLoadingRules] = useState(true)
  const [openMobileMenu, setOpenMobileMenu] = useState(false)

  const loadBookingsForDate = async (selectedDate: Date) => {
    if (!selectedDate) return
    
    setIsLoading(true)
    setError("")
    
    try {
      // Create start and end date for the selected day
      const startDate = new Date(selectedDate)
      startDate.setHours(0, 0, 0, 0)
      
      const endDate = new Date(selectedDate)
      endDate.setHours(23, 59, 59, 999)
      
      // Convert to ISO strings for the API
      const startDateStr = startDate.toISOString()
      const endDateStr = endDate.toISOString()
      
      // Load spaces
      const spacesResult = await getAllSpaces()
      if (spacesResult.success) {
        setSpaces(spacesResult.data || [])
      } else if (spacesResult.error) {
        console.error("Error loading spaces:", spacesResult.error)
        if (spacesResult.error.includes("Invalid email or password") || 
            spacesResult.error.includes("Not authenticated")) {
          setError("Authentication error. Please log in again.")
          return
        } else {
          setError(`Failed to load spaces: ${spacesResult.error}`)
          return
        }
      }
      
      // Load bookings for the date range
      const bookingsResult = await getBookingsForDateRange(startDateStr, endDateStr)
      if (bookingsResult.success) {
        setBookings(bookingsResult.data || [])
      } else if (bookingsResult.error) {
        console.error("Error loading bookings:", bookingsResult.error)
        if (bookingsResult.error.includes("Invalid email or password") || 
            bookingsResult.error.includes("Not authenticated")) {
          setError("Authentication error. Please log in again.")
        } else {
          setError(`Failed to load bookings: ${bookingsResult.error}`)
        }
      }
    } catch (err) {
      console.error("Error loading booking data:", err)
      if (err instanceof Error && 
          (err.message.includes("Invalid email or password") || 
           err.message.includes("Not authenticated"))) {
        setError("Authentication error. Please log in again.")
      } else {
        setError("Failed to load booking data")
      }
    } finally {
      setIsLoading(false)
    }
  }

  // Load booking rules and check future bookings count
  const loadBookingRulesAndFutureBookings = async (foodTruckId: string) => {
    setLoadingRules(true)
    try {
      // Get booking rules
      const rulesResult = await getBookingRules()
      if (rulesResult.success && rulesResult.data) {
        setBookingRules(rulesResult.data)
      } else if (rulesResult.error) {
        console.error("Error loading booking rules:", rulesResult.error)
      }
      
      // Get future bookings
      const now = new Date()
      const bookingsResult = await getFoodTruckBookings(foodTruckId)
      if (bookingsResult.success) {
        // Count only future bookings
        const future = (bookingsResult.data || [])
          .filter((booking: any) => new Date(booking.start) > now)
        
        setFutureBookings(future.length)
      } else if (bookingsResult.error) {
        console.error("Error loading bookings:", bookingsResult.error)
      }
    } catch (err) {
      console.error("Error loading booking rules data:", err)
    } finally {
      setLoadingRules(false)
    }
  }

  // Load user's food truck
  useEffect(() => {
    async function loadUserData() {
      try {
        // Get user's food truck
        const result = await getUserFoodTruck()
        if (result.success && result.data) {
          setUserFoodTruck(result.data)
          
          // Load booking rules and future bookings
          await loadBookingRulesAndFutureBookings(result.data.id)
        } else if (result.error) {
          console.error("Error loading food truck:", result.error)
          if (result.error.includes("Invalid email or password") || 
              result.error.includes("Not authenticated")) {
            setError("Authentication error. Please log in again.")
          }
        }
      } catch (err) {
        console.error("Error loading food truck data:", err)
      }
    }
    
    loadUserData()
  }, [])

  // Load data when date changes
  useEffect(() => {
    if (date) {
      loadBookingsForDate(date)
    }
  }, [date])

  const isSpaceBooked = (spaceId: string, timeSlot: { start: string, end: string }) => {
    if (!bookings || !bookings.length) return false;

    const formatTimeString = (timeStr: string) => {
      return timeStr.includes(':') ? timeStr.split(':').slice(0, 2).join(':') : timeStr;
    };

    const timeSlotStart = new Date(date || new Date());
    const formattedStart = formatTimeString(timeSlot.start);
    const [startHours, startMinutes] = formattedStart.split(':').map(num => parseInt(num));
    timeSlotStart.setHours(startHours, startMinutes, 0, 0);

    const timeSlotEnd = new Date(date || new Date());
    const formattedEnd = formatTimeString(timeSlot.end);
    const [endHours, endMinutes] = formattedEnd.split(':').map(num => parseInt(num));
    timeSlotEnd.setHours(endHours, endMinutes, 0, 0);

    return bookings.some(booking => {
      try {
        if (!booking || !booking.start || !booking.end || !booking.space) {
          return false;
        }

        const bookingStart = new Date(booking.start);
        const bookingEnd = new Date(booking.end);

        // Ensure comparison happens correctly even across day boundaries if necessary
        // This basic check assumes bookings and slots are within the same day context
        // as handled by the date selection.

        return (
          booking.space.id === spaceId &&
          (
            // CORRECTED OVERLAP CHECK:
            // Booking overlaps if it starts BEFORE the slot ends
            // AND ends AFTER the slot starts.
            // Using strict inequality prevents adjacent slots from being marked.
            bookingStart < timeSlotEnd && bookingEnd > timeSlotStart
          )
        );
      } catch (error) {
        console.error("Error processing booking in isSpaceBooked:", error, booking);
        return false;
      }
    });
  };

  // Get booking details for a space and time slot
  const getBookingDetails = (spaceId: string, timeSlot: { start: string, end: string }) => {
    if (!bookings || !bookings.length) return null;

    const formatTimeString = (timeStr: string) => {
      return timeStr.includes(':') ? timeStr.split(':').slice(0, 2).join(':') : timeStr;
    };

    const timeSlotStart = new Date(date || new Date());
    const formattedStart = formatTimeString(timeSlot.start);
    const [startHours, startMinutes] = formattedStart.split(':').map(num => parseInt(num));
    timeSlotStart.setHours(startHours, startMinutes, 0, 0);

    const timeSlotEnd = new Date(date || new Date());
    const formattedEnd = formatTimeString(timeSlot.end);
    const [endHours, endMinutes] = formattedEnd.split(':').map(num => parseInt(num));
    timeSlotEnd.setHours(endHours, endMinutes, 0, 0);

    return bookings.find(booking => {
      try {
        if (!booking || !booking.start || !booking.end || !booking.space) {
          return false;
        }

        const bookingStart = new Date(booking.start);
        const bookingEnd = new Date(booking.end);

        return (
          booking.space.id === spaceId &&
          (
            // CORRECTED OVERLAP CHECK (same as in isSpaceBooked):
            bookingStart < timeSlotEnd && bookingEnd > timeSlotStart
          )
        );
      } catch (error) {
        console.error("Error processing booking in getBookingDetails:", error, booking);
        return false;
      }
    });
  };

  // Check if a booking is within the last-minute booking window
  const isLastMinuteBooking = (startTime: Date): boolean => {
    if (!bookingRules) return false
    
    const now = new Date()
    const hoursUntilBooking = (startTime.getTime() - now.getTime()) / (1000 * 60 * 60)
    
    return hoursUntilBooking <= bookingRules.last_minute_booking_hours
  }

  // Start the booking process
  const handleBookSpace = (space: any, timeSlot: any) => {
    if (!userFoodTruck) {
      toast({
        title: "Food truck not found",
        description: "You need a registered food truck to make bookings",
        variant: "destructive"
      })
      return
    }
    
    // If user is at max bookings, check if this is a last-minute booking
    if (bookingRules && futureBookings >= bookingRules.maximum_future_bookings) {
      // Calculate start time for this booking
      const bookingStartDate = new Date(date || new Date())
      const formattedStart = timeSlot.start.includes(':') ? 
        timeSlot.start.split(':').slice(0, 2).join(':') : 
        timeSlot.start
      
      const [startHours, startMinutes] = formattedStart.split(':').map(num => parseInt(num))
      bookingStartDate.setHours(startHours, startMinutes, 0, 0)
      
      // If it's not a last-minute booking, don't allow it
      if (!isLastMinuteBooking(bookingStartDate)) {
        toast({
          title: "Maximum bookings reached",
          description: `You already have ${bookingRules.maximum_future_bookings} future bookings. You can only make last-minute bookings within ${bookingRules.last_minute_booking_hours} hours.`,
          variant: "destructive"
        })
        return
      }
    }
    
    setBookingSpace(space)
    setBookingTimeSlot(timeSlot)
    setShowBookingConfirm(true)
  }
  
  // Create the actual booking
  const confirmBooking = async () => {
    if (!userFoodTruck || !bookingSpace || !bookingTimeSlot || !date) {
      toast({
        title: "Error",
        description: "Missing required information for booking",
        variant: "destructive"
      })
      return
    }
    
    setIsBooking(true)
    
    try {
      // Format of time_slots can be "08:00:00" or "08:00"
      const formatTimeString = (timeStr: string) => {
        return timeStr.includes(':') ? timeStr.split(':').slice(0, 2).join(':') : timeStr
      }
      
      // Calculate date and time for booking in UTC
      const selectedDay = new Date(date)
      const formattedStart = formatTimeString(bookingTimeSlot.start)
      const [startHours, startMinutes] = formattedStart.split(':').map(num => parseInt(num))
      // Create startDate using UTC to match how the calendar component creates dates
      const startDate = new Date(Date.UTC(
        selectedDay.getFullYear(),
        selectedDay.getMonth(),
        selectedDay.getDate(),
        startHours,
        startMinutes,
        0
      ))
      
      const formattedEnd = formatTimeString(bookingTimeSlot.end)
      const [endHours, endMinutes] = formattedEnd.split(':').map(num => parseInt(num))
      // Create endDate using UTC to match how the calendar component creates dates
      const endDate = new Date(Date.UTC(
        selectedDay.getFullYear(),
        selectedDay.getMonth(),
        selectedDay.getDate(),
        endHours,
        endMinutes,
        0
      ))
      
      // Create booking data
      const bookingData = {
        foodtruck: userFoodTruck.id,
        space: bookingSpace.id,
        start: startDate.toISOString(),
        end: endDate.toISOString()
      }
      
      // Call the createBooking action
      const result = await createBooking(bookingData)
      
      if (result.success) {
        toast({
          title: "Booking confirmed!",
          description: `You have booked ${bookingSpace.name} for ${bookingTimeSlot.description} on ${format(date, "MMMM do, yyyy")}`,
          variant: "default"
        })
        
        // Close the confirmation dialog and refresh the bookings
        setShowBookingConfirm(false)
        
        // Refresh the calendar view
        loadBookingsForDate(date)
        
        // Refresh future bookings count and rules
        if (userFoodTruck && userFoodTruck.id) {
          await loadBookingRulesAndFutureBookings(userFoodTruck.id)
        }
      } else if (result.error) {
        toast({
          title: "Booking failed",
          description: result.error,
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Booking error:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive"
      })
    } finally {
      setIsBooking(false)
    }
  }
  
  // Cancel the booking process (dialog)
  const cancelBooking = () => {
    setShowBookingConfirm(false)
    setBookingSpace(null)
    setBookingTimeSlot(null)
  }

  return (
    <ProtectedRoute>
      <SidebarProvider defaultOpen={true}>
        <div className="flex h-screen w-full relative">
          <AppSidebar openMobile={openMobileMenu} setOpenMobile={setOpenMobileMenu} />
          <div className="flex-1 p-4 md:p-6 overflow-auto w-full">
            <Button 
              variant="outline" 
              size="icon" 
              className="md:hidden fixed top-4 left-4 z-40" 
              onClick={() => setOpenMobileMenu(true)}
            >
              <PanelLeftIcon className="h-4 w-4" />
            </Button>
            <header className="flex justify-between items-center mb-8">
              <div>
                <div className="flex items-center gap-2">
                  <Soup size={24} className="text-primary mr-2" />
                  <h1 className="text-2xl font-bold">Book a Space</h1>
                </div>
                <p className="text-muted-foreground">Select a date and book available spaces</p>
              </div>
            </header>

            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6">
                <p className="mb-2">{error}</p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => date && loadBookingsForDate(date)}
                  >
                    Try again
                  </Button>
                  {error.includes("Authentication") && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        logout();
                        window.location.href = "/login";
                      }}
                    >
                      Return to login
                    </Button>
                  )}
                </div>
              </div>
            )}
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6 min-h-[calc(100vh-10rem)] w-full">
              {/* Calendar Column - 1/3 width */}
              <div className="space-y-4">
                <Card className="flex flex-col">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <CalendarIcon className="mr-2 h-5 w-5" />
                      Select Date
                    </CardTitle>
                    <CardDescription>
                      Choose a date to see available spaces
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1 flex flex-col justify-start items-center pt-4">
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={setDate}
                      weekStartsOn={1}
                      className=""
                      disabled={{ 
                        before: new Date(),
                        after: bookingRules ? addDays(new Date(), bookingRules.maximum_days_ahead) : undefined 
                      }}
                    />
                  </CardContent>
                  <CardFooter>
                    <p className="text-sm text-muted-foreground">
                      {date ? (
                        <>Showing spaces for <strong>{format(date, "EEEE, MMMM do, yyyy")}</strong></>
                      ) : (
                        "Please select a date"
                      )}
                    </p>
                  </CardFooter>
                </Card>
                
                {/* Booking Rules */}
                <BookingRules 
                  rules={bookingRules} 
                  futureBookings={futureBookings}
                  isLoading={loadingRules}
                />
              </div>

              {/* Spaces and Timeslots Column - 2/3 width */}
              <div className="h-full flex flex-col lg:col-span-2">
                <Card className="h-full flex flex-col">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <MapPin className="mr-2 h-5 w-5" />
                      Available Spaces
                    </CardTitle>
                    <CardDescription>
                      Spaces and time slots for {date ? format(date, "MMMM do, yyyy") : "the selected date"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1 overflow-auto">
                    {isLoading ? (
                      <div className="flex justify-center items-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                      </div>
                    ) : spaces.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        No spaces available
                      </div>
                    ) : (
                      <div className="space-y-4 max-h-[65vh] md:max-h-full overflow-auto pr-1">
                        {spaces.map((space) => (
                          <div key={space.id} className="bg-card rounded-md shadow-sm p-4">
                            <div className="flex justify-between items-start mb-2">
                              <div className="w-full">
                                <div 
                                  className="flex items-center justify-between cursor-pointer hover:text-primary transition-colors"
                                  onClick={() => router.push(`/spaces/${space.id}`)}
                                >
                                  <h3 className="font-medium">{space.name}</h3>
                                  <span className="text-xs text-primary underline">View Details</span>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                  {space.description ? space.description : "No description available"}
                                </p>
                              </div>
                            </div>
                            
                            <Separator className="my-3" />
                            
                            <div className="space-y-3">
                              <div className="grid grid-cols-1 gap-2">
                                {space.time_slots && Array.isArray(space.time_slots) && space.time_slots.length > 0 ? (
                                  space.time_slots.map((timeSlot, index) => {
                                    // Make sure the timeSlot has an id
                                    const timeSlotWithId = { 
                                      ...timeSlot, 
                                      id: timeSlot.id || `ts_${index}` 
                                    };
                                    const isBooked = isSpaceBooked(space.id, timeSlotWithId)
                                    const bookingDetails = isBooked ? getBookingDetails(space.id, timeSlotWithId) : null
                                  
                                  return (
                                    <div 
                                      key={timeSlotWithId.id} 
                                      className={`p-3 rounded-md flex justify-between items-center ${isBooked ? 'bg-gray-50' : 'bg-gray-50/30'}`}
                                    >
                                      <div>
                                        <div className="font-medium">{timeSlotWithId.description || timeSlotWithId.name || `Slot ${timeSlotWithId.id}`}</div>
                                        <div className="text-sm text-muted-foreground">
                                          {timeSlotWithId.start?.split(':').slice(0, 2).join(':')} - {timeSlotWithId.end?.split(':').slice(0, 2).join(':')}
                                        </div>
                                      </div>
                                      
                                      {isBooked ? (
                                        <div className="flex items-center text-sm text-muted-foreground">
                                          <User size={14} className="mr-1" />
                                          Booked by {bookingDetails?.foodtruck?.name ? 
                                            typeof bookingDetails.foodtruck.name === 'object' ? 
                                              "Another food truck" : 
                                              String(bookingDetails.foodtruck.name) 
                                            : "Unknown"}
                                        </div>
                                      ) : (
                                        <Button
                                          size="sm"
                                          onClick={() => handleBookSpace(space, timeSlotWithId)}
                                        >
                                          <Check size={14} className="mr-1" />
                                          Book
                                        </Button>
                                      )}
                                    </div>
                                  )
                                })) : (
                                  <div className="p-3 text-center text-muted-foreground">
                                    No time slots available for this space
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
          
          {/* Booking Confirmation Dialog */}
          {showBookingConfirm && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 max-w-md w-full m-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">Confirm Booking</h3>
                  <button 
                    onClick={cancelBooking}
                    className="text-gray-500 hover:text-gray-700"
                    disabled={isBooking}
                  >
                    <X size={20} />
                  </button>
                </div>
                
                <div className="space-y-4">
                  <div className="p-4 bg-gray-50 rounded-md">
                    <div className="flex items-start gap-3">
                      <MapPin className="mt-0.5 text-primary" size={18} />
                      <div>
                        <p className="font-medium">{bookingSpace?.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {bookingSpace?.description ? bookingSpace.description : "No description available"}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-4 bg-gray-50 rounded-md">
                    <div className="flex items-start gap-3">
                      <CalendarIcon className="mt-0.5 text-primary" size={18} />
                      <div>
                        <p className="font-medium">{date ? format(date, "EEEE, MMMM do, yyyy") : ""}</p>
                        <p className="text-sm text-muted-foreground">
                          {bookingTimeSlot?.description || bookingTimeSlot?.name || `Slot ${bookingTimeSlot?.id}`}: {bookingTimeSlot?.start?.split(':').slice(0, 2).join(':')} - {bookingTimeSlot?.end?.split(':').slice(0, 2).join(':')}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-4 bg-gray-50 rounded-md">
                    <div className="flex items-start gap-3">
                      <Soup className="mt-0.5 text-primary" size={18} />
                      <div>
                        <p className="font-medium">{userFoodTruck?.name}</p>
                        <p className="text-sm text-muted-foreground">Your food truck</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-end gap-3 mt-6">
                  <Button
                    variant="outline"
                    onClick={cancelBooking}
                    disabled={isBooking}
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={confirmBooking}
                    disabled={isBooking}
                  >
                    {isBooking ? (
                      <>
                        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-b-transparent"></div>
                        Processing...
                      </>
                    ) : (
                      <>
                        <Check className="mr-2 h-4 w-4" />
                        Confirm Booking
                      </>
                    )}
                  </Button>
                </div>
                
                {error && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-600 text-sm flex items-center">
                    <AlertCircle className="mr-2 h-4 w-4" />
                    {error}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </SidebarProvider>
    </ProtectedRoute>
  )
}