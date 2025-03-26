"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ProtectedRoute } from "@/components/protected-route"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { DateRangePicker } from "@/components/date-range-picker"
import { BookingCalendar } from "@/components/booking-calendar"
import { useToast, Toast } from "@/components/toast-notification"
import { 
  getAllSpaces, 
  getBookingsForDateRange, 
  getUserFoodTruck, 
  getBookingRules, 
  createBooking,
  cancelBooking
} from "@/app/actions"
import { addDays } from "date-fns"

export default function BookingPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { showToast, updateToast, dismissToast, ToastContainer } = useToast()
  
  // State for dates, bookings, and UI
  const [startDate, setStartDate] = useState<Date>(new Date())
  const [endDate, setEndDate] = useState<Date>(addDays(new Date(), 6))
  const [spaces, setSpaces] = useState<any[]>([])
  const [foodTruck, setFoodTruck] = useState<any>(null)
  const [bookingRules, setBookingRules] = useState<any>(null)
  const [activeTab, setActiveTab] = useState("calendar")
  
  // State for error handling and loading
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [successMessage, setSuccessMessage] = useState("")
  
  // Load initial data
  useEffect(() => {
    async function loadData() {
      setIsLoading(true)
      setError("")
      
      try {
        // Load booking rules
        const rulesResult = await getBookingRules()
        if (rulesResult.success && rulesResult.data) {
          setBookingRules(rulesResult.data)
        } else {
          throw new Error(rulesResult.error || "Failed to load booking rules")
        }
        
        // Load food truck
        const foodTruckResult = await getUserFoodTruck()
        if (foodTruckResult.success) {
          setFoodTruck(foodTruckResult.data)
        } else {
          throw new Error(foodTruckResult.error || "Failed to load food truck")
        }
        
        // Load spaces
        const spacesResult = await getAllSpaces()
        if (spacesResult.success) {
          setSpaces(spacesResult.data || [])
        } else {
          throw new Error(spacesResult.error || "Failed to load spaces")
        }
      } catch (err) {
        console.error("Error loading booking data:", err)
        setError(err instanceof Error ? err.message : "Failed to load booking data")
      } finally {
        setIsLoading(false)
      }
    }
    
    loadData()
  }, [])
  
  // Handle date range change
  const handleDateRangeChange = (start: Date, end: Date) => {
    setStartDate(start)
    setEndDate(end)
  }
  
  // Book a slot
  const bookSlot = async (spaceId: string, timeSlot: any, date: Date) => {
    if (!foodTruck) {
      showToast("You need to have a food truck to make a booking", "error")
      return
    }
    
    setIsSubmitting(true)
    setError("")
    
    try {
      // Convert time strings to Date objects for the selected date
      const slotStart = new Date(date)
      const [startHours, startMinutes] = timeSlot.start.split(':').map(Number)
      slotStart.setHours(startHours, startMinutes, 0, 0)
      
      const slotEnd = new Date(date)
      const [endHours, endMinutes] = timeSlot.end.split(':').map(Number)
      slotEnd.setHours(endHours, endMinutes, 0, 0)
      
      const bookingData = {
        foodtruck: foodTruck.id,
        space: spaceId,
        start: slotStart.toISOString(),
        end: slotEnd.toISOString(),
      }
      
      // Show loading toast
      const toastId = showToast("Creating booking...", "loading", 0)
      
      // Note: UI is already updated via optimistic update in the calendar component
      
      const result = await createBooking(bookingData)
      
      if (result.success) {
        // Update toast to success
        updateToast(toastId, {
          message: "Booking created successfully!",
          type: "success",
          duration: 3000
        })
      } else {
        // Update toast to error
        updateToast(toastId, {
          message: result.error || "Failed to create booking",
          type: "error",
          duration: 5000
        })
        
        // If there was an error, we might need to refresh the data to revert the optimistic update
        // This will be handled automatically by the revalidation in the server action
      }
    } catch (err) {
      console.error("Error creating booking:", err)
      showToast(
        err instanceof Error ? err.message : "Failed to create booking", 
        "error"
      )
    } finally {
      setIsSubmitting(false)
    }
  }
  
  // Cancel a booking
  const handleCancelBooking = async (bookingId: string) => {
    setIsSubmitting(true)
    setError("")
    
    try {
      // Show loading toast
      const toastId = showToast("Canceling booking...", "loading", 0)
      
      // Note: UI is already updated via optimistic update in the calendar component
      
      const result = await cancelBooking(bookingId)
      
      if (result.success) {
        // Update toast to success
        updateToast(toastId, {
          message: "Booking canceled successfully!",
          type: "success",
          duration: 3000
        })
      } else {
        // Update toast to error
        updateToast(toastId, {
          message: result.error || "Failed to cancel booking",
          type: "error",
          duration: 5000
        })
        
        // If there was an error, we might need to refresh the data to revert the optimistic update
        // This will be handled automatically by the revalidation in the server action
      }
    } catch (err) {
      console.error("Error canceling booking:", err)
      showToast(
        err instanceof Error ? err.message : "Failed to cancel booking", 
        "error"
      )
    } finally {
      setIsSubmitting(false)
    }
  }
  
  return (
    <ProtectedRoute>
      <div className="min-h-screen p-8">
        <header className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold">Food Truck Booking</h1>
          <Button variant="outline" onClick={() => router.push("/")}>
            Back to Dashboard
          </Button>
        </header>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6">
            {error}
          </div>
        )}
        
        <ToastContainer />
        
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="space-y-6">
            <Tabs defaultValue="calendar" value={activeTab} onValueChange={setActiveTab}>
              <div className="flex justify-between items-center">
                <TabsList>
                  <TabsTrigger value="calendar">Booking Calendar</TabsTrigger>
                  <TabsTrigger value="rules">Booking Rules</TabsTrigger>
                </TabsList>
              </div>
              
              <TabsContent value="calendar" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="md:col-span-1">
                    <DateRangePicker 
                      startDate={startDate}
                      endDate={endDate}
                      onChange={handleDateRangeChange}
                      maxDaysAhead={bookingRules?.maximum_days_ahead || 7}
                    />
                    
                    <Card className="mt-4">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-md">Booking Status</CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-green-100"></div>
                          <span className="text-sm">Your Booking</span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="w-3 h-3 rounded-full bg-red-50"></div>
                          <span className="text-sm">Booked by Others</span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="w-3 h-3 rounded-full bg-blue-50"></div>
                          <span className="text-sm">Available</span>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                  
                  <div className="md:col-span-3">
                    <BookingCalendar 
                      startDate={startDate}
                      endDate={endDate}
                      spaces={spaces}
                      onBookClick={bookSlot}
                      onCancelClick={handleCancelBooking}
                      foodTruck={foodTruck}
                    />
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="rules">
                <Card>
                  <CardHeader>
                    <CardTitle>Booking Rules</CardTitle>
                    <CardDescription>
                      The following rules govern how bookings can be made in the system.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <dl className="space-y-4">
                      <div>
                        <dt className="font-medium">Maximum Future Bookings</dt>
                        <dd className="text-muted-foreground">
                          You can have up to <span className="font-semibold">{bookingRules?.maximum_future_bookings || 3}</span> future bookings at any time.
                        </dd>
                      </div>
                      
                      <Separator />
                      
                      <div>
                        <dt className="font-medium">Maximum Days Ahead</dt>
                        <dd className="text-muted-foreground">
                          You can book up to <span className="font-semibold">{bookingRules?.maximum_days_ahead || 7}</span> days in advance.
                        </dd>
                      </div>
                      
                      <Separator />
                      
                      <div>
                        <dt className="font-medium">Time Slots</dt>
                        <dd className="text-muted-foreground space-y-2">
                          <p>Each day is divided into two time slots:</p>
                          <ul className="list-disc list-inside">
                            <li>Morning: 08:00 - 15:00</li>
                            <li>Evening: 15:00 - 22:00</li>
                          </ul>
                        </dd>
                      </div>
                      
                      <Separator />
                      
                      <div>
                        <dt className="font-medium">Booking Cancellation</dt>
                        <dd className="text-muted-foreground">
                          You can cancel your booking at any time. However, frequent cancellations may affect your ability to make future bookings.
                        </dd>
                      </div>
                    </dl>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </div>
    </ProtectedRoute>
  )
}