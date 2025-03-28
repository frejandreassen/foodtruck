"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { ProtectedRoute } from "@/components/protected-route"
import { useAuth } from "@/lib/auth-context"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BookingList } from "@/components/booking-list"
import { getUserFoodTruck, getFoodTruckBookings, cancelBooking, getBookingRules } from "@/app/actions"
import { Soup, PlusCircle, Calendar, Clock, MapPin, AlertCircle, PanelLeftIcon } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { BookingRules } from "@/components/booking-rules"

export default function Dashboard() {
  const { user } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [foodTruck, setFoodTruck] = useState<any>(null)
  const [upcomingBookings, setUpcomingBookings] = useState<any[]>([])
  const [pastBookings, setPastBookings] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [cancellingBooking, setCancellingBooking] = useState<string | null>(null)
  const [bookingToCancel, setBookingToCancel] = useState<any>(null)
  const [showCancelDialog, setShowCancelDialog] = useState(false)
  const [error, setError] = useState("")
  const [bookingRules, setBookingRules] = useState<null | {
    maximum_future_bookings: number;
    maximum_days_ahead: number;
    last_minute_booking_hours: number;
  }>(null)
  const [loadingRules, setLoadingRules] = useState(true)
  const [openMobileMenu, setOpenMobileMenu] = useState(false)

  // Format time in HH:MM format - using actual time values from string
  const formatTime = (dateStr: string) => {
    // Extract time directly from ISO string for consistency
    // Format: 2023-04-25T09:00:00.000Z -> get 09:00 part
    const timeComponent = dateStr.split('T')[1].substring(0, 5)
    return timeComponent
  }

  async function loadData() {
    setIsLoading(true)
    setError("")
    setLoadingRules(true)
    
    try {
      // Load food truck
      const foodTruckResult = await getUserFoodTruck()
      if (foodTruckResult.success && foodTruckResult.data) {
        setFoodTruck(foodTruckResult.data)
        
        // Load this food truck's bookings
        const bookingsResult = await getFoodTruckBookings(foodTruckResult.data.id)
        if (bookingsResult.success) {
          // Separate bookings into upcoming and past
          const now = new Date()
          
          const upcoming = (bookingsResult.data || [])
            .filter((booking: any) => new Date(booking.start) > now)
            .sort((a: any, b: any) => new Date(a.start).getTime() - new Date(b.start).getTime())
          
          const past = (bookingsResult.data || [])
            .filter((booking: any) => new Date(booking.start) <= now)
            .sort((a: any, b: any) => new Date(b.start).getTime() - new Date(a.start).getTime()) // Most recent first
          
          setUpcomingBookings(upcoming)
          setPastBookings(past)
        }
        
        // Load booking rules
        const rulesResult = await getBookingRules()
        if (rulesResult.success && rulesResult.data) {
          setBookingRules(rulesResult.data)
        } else if (rulesResult.error) {
          console.error("Error loading booking rules:", rulesResult.error)
        }
      } else if (foodTruckResult.error) {
        setError(foodTruckResult.error)
      }
    } catch (err) {
      console.error("Error loading dashboard data:", err)
      setError("Failed to load dashboard data")
    } finally {
      setIsLoading(false)
      setLoadingRules(false)
    }
  }
  
  // Open the cancel booking dialog
  const openCancelDialog = (booking: any) => {
    setBookingToCancel(booking)
    setShowCancelDialog(true)
  }
  
  // Close the cancel booking dialog
  const closeCancelDialog = () => {
    setShowCancelDialog(false)
    setBookingToCancel(null)
  }
  
  // Handle booking cancellation
  const handleCancelBooking = async () => {
    if (!bookingToCancel) return
    
    const bookingId = bookingToCancel.id
    setCancellingBooking(bookingId)
    
    try {
      const result = await cancelBooking(bookingId)
      
      if (result.success) {
        toast({
          title: "Booking cancelled",
          description: "Your booking has been successfully cancelled",
          variant: "default"
        })
        
        // Close dialog and refresh booking data
        closeCancelDialog()
        loadData()
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to cancel booking",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Error cancelling booking:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive"
      })
    } finally {
      setCancellingBooking(null)
    }
  }

  // Load data on component mount
  useEffect(() => {
    loadData()
  }, [])

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
                  <h1 className="text-2xl font-bold">Dashboard</h1>
                </div>
                <p className="text-muted-foreground">Welcome, {user?.first_name || user?.email}</p>
              </div>
              
              <Button 
                onClick={() => router.push("/booking")}
                className="gap-2"
              >
                <PlusCircle size={16} />
                Book a Space
              </Button>
            </header>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6">
              {error}
              <Button
                variant="link"
                onClick={loadData}
                className="underline ml-2 p-0 h-auto"
              >
                Try again
              </Button>
            </div>
          )}

          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : (
            <main className="space-y-6 w-full">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle>Food Truck</CardTitle>
                    <CardDescription>Your registered information</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {foodTruck ? (
                      <div className="space-y-3">
                        <div>
                          <p className="font-medium">{foodTruck.name}</p>
                          <p className="text-sm text-muted-foreground">Registered Food Truck</p>
                        </div>
                        {foodTruck.description && (
                          <div>
                            <p className="text-sm">{foodTruck.description}</p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-muted-foreground">No food truck found.</div>
                    )}
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle>Account</CardTitle>
                    <CardDescription>Your user information</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div>
                        <p className="font-medium">{user?.email}</p>
                        <p className="text-sm text-muted-foreground">Email Address</p>
                      </div>
                      {user?.first_name && (
                        <div>
                          <p className="font-medium">{user.first_name} {user.last_name}</p>
                          <p className="text-sm text-muted-foreground">Full Name</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle>Quick Actions</CardTitle>
                    <CardDescription>Common tasks</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <Button 
                        variant="outline" 
                        className="w-full justify-start"
                        onClick={() => router.push("/booking")}
                      >
                        <Calendar className="mr-2 h-4 w-4" />
                        Book a Space
                      </Button>
                      <Button 
                        variant="outline" 
                        className="w-full justify-start"
                        onClick={() => router.push("/spaces-overview")}
                      >
                        <MapPin className="mr-2 h-4 w-4" />
                        View Spaces Map
                      </Button>
                      <Button 
                        variant="outline" 
                        className="w-full justify-start"
                        onClick={() => router.push("/spaces-list")}
                      >
                        <MapPin className="mr-2 h-4 w-4" />
                        Browse All Spaces
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              {/* Booking Rules */}
              <div className="mb-6">
                <BookingRules 
                  rules={bookingRules} 
                  futureBookings={upcomingBookings.length}
                  isLoading={loadingRules}
                />
              </div>
              
              {/* Bookings Management */}
              <Card className="w-full">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Your Bookings
                  </CardTitle>
                  <CardDescription>
                    View and manage all your food truck space bookings
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="upcoming" className="w-full">
                    <TabsList className="mb-4">
                      <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
                      <TabsTrigger value="past">Past</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="upcoming" className="space-y-4">
                      {bookingRules && (
                        <div className="flex items-center justify-between mb-4">
                          <p className="text-sm font-medium">
                            {upcomingBookings.length} of {bookingRules.maximum_future_bookings} future bookings used
                          </p>
                          {upcomingBookings.length > 0 && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => router.push("/booking")}
                            >
                              Book More Spaces
                            </Button>
                          )}
                        </div>
                      )}
                      
                      {upcomingBookings.length === 0 ? (
                        <div className="text-center p-6 text-muted-foreground">
                          <Clock className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                          <p className="mb-2">You don't have any upcoming bookings</p>
                          <Button 
                            onClick={() => router.push("/booking")}
                            variant="outline"
                            className="mt-2"
                          >
                            Book a Space
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {upcomingBookings.map(booking => (
                            <div key={booking.id} className="border rounded-md p-4">
                              <div className="flex justify-between items-start">
                                <div>
                                  <h3 className="font-medium flex items-center">
                                    {booking.space?.name || "Space"}
                                    <a 
                                      href={`/spaces/${booking.space?.id}`} 
                                      className="ml-2 text-xs text-primary underline hover:text-primary/80"
                                    >
                                      View space
                                    </a>
                                  </h3>
                                  <div className="text-sm text-muted-foreground space-y-1">
                                    <p className="flex items-center">
                                      <Calendar className="mr-2 h-4 w-4" />
                                      {format(new Date(booking.start), "EEEE, MMMM d, yyyy")}
                                    </p>
                                    <p className="flex items-center">
                                      <Clock className="mr-2 h-4 w-4" />
                                      {formatTime(booking.start)} - {formatTime(booking.end)}
                                    </p>
                                    <p className="flex items-center">
                                      <MapPin className="mr-2 h-4 w-4" />
                                      {booking.space?.description || "No description available"}
                                    </p>
                                  </div>
                                </div>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => openCancelDialog(booking)}
                                  disabled={cancellingBooking === booking.id}
                                >
                                  {cancellingBooking === booking.id ? (
                                    <>
                                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-b-transparent"></div>
                                      Cancelling...
                                    </>
                                  ) : (
                                    "Cancel"
                                  )}
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </TabsContent>
                    
                    <TabsContent value="past" className="space-y-4">
                      {pastBookings.length === 0 ? (
                        <div className="text-center p-6 text-muted-foreground">
                          <Clock className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                          <p>You don't have any past bookings</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {pastBookings.map(booking => (
                            <div key={booking.id} className="border rounded-md p-4 bg-gray-50">
                              <div className="flex justify-between items-start">
                                <div>
                                  <h3 className="font-medium flex items-center">
                                    {booking.space?.name || "Space"}
                                    <a 
                                      href={`/spaces/${booking.space?.id}`} 
                                      className="ml-2 text-xs text-primary underline hover:text-primary/80"
                                    >
                                      View space
                                    </a>
                                  </h3>
                                  <div className="text-sm text-muted-foreground space-y-1">
                                    <p className="flex items-center">
                                      <Calendar className="mr-2 h-4 w-4" />
                                      {format(new Date(booking.start), "EEEE, MMMM d, yyyy")}
                                    </p>
                                    <p className="flex items-center">
                                      <Clock className="mr-2 h-4 w-4" />
                                      {formatTime(booking.start)} - {formatTime(booking.end)}
                                    </p>
                                    <p className="flex items-center">
                                      <MapPin className="mr-2 h-4 w-4" />
                                      {booking.space?.description || "No description available"}
                                    </p>
                                  </div>
                                </div>
                                <div className="text-xs px-2 py-1 bg-gray-200 rounded-md text-gray-700">
                                  Completed
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </TabsContent>
                  </Tabs>
                </CardContent>
                <CardFooter className="border-t pt-4">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => router.push("/booking")}
                    className="ml-auto"
                  >
                    Book More Spaces
                  </Button>
                </CardFooter>
              </Card>
            </main>
          )}
        </div>
        
        {/* Cancel Booking Dialog */}
        <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Cancel Booking</DialogTitle>
              <DialogDescription>
                Are you sure you want to cancel this booking? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            
            {bookingToCancel && (
              <div className="py-4">
                <div className="space-y-3 mb-4">
                  <div className="p-4 bg-gray-50 rounded-md">
                    <p className="font-medium">{bookingToCancel.space?.name || "Space"}</p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(bookingToCancel.start), "EEEE, MMMM d, yyyy")}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {formatTime(bookingToCancel.start)} - {formatTime(bookingToCancel.end)}
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            <DialogFooter>
              <Button variant="outline" onClick={closeCancelDialog}>
                Keep Booking
              </Button>
              <Button 
                variant="destructive" 
                onClick={handleCancelBooking}
                disabled={cancellingBooking === bookingToCancel?.id}
              >
                {cancellingBooking === bookingToCancel?.id ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-b-transparent"></div>
                    Cancelling...
                  </>
                ) : (
                  "Cancel Booking"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      </SidebarProvider>
    </ProtectedRoute>
  )
}