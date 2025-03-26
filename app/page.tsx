"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ProtectedRoute } from "@/components/protected-route"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { FoodTruckDetails } from "@/components/food-truck-details"
import { BookingList } from "@/components/booking-list"
import { BookingRules } from "@/components/booking-rules"
import { useToast } from "@/components/toast-notification"
import { getUserFoodTruck, getFoodTruckBookings, getBookingRules, cancelBooking } from "@/app/actions"

export default function Dashboard() {
  const { user, logout } = useAuth()
  const router = useRouter()
  const { showToast, updateToast, dismissToast, ToastContainer } = useToast()
  
  const [foodTruck, setFoodTruck] = useState<any>(null)
  const [bookings, setBookings] = useState<any[]>([])
  const [bookingRules, setBookingRules] = useState<any>({
    maximum_future_bookings: 3,
    maximum_days_ahead: 7
  })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [activeTab, setActiveTab] = useState("dashboard")

  // Separate current and upcoming bookings
  const now = new Date()
  const currentBookings = bookings.filter(booking => {
    const endDate = new Date(booking.end)
    return endDate >= now && new Date(booking.start) <= now
  })
  
  const upcomingBookings = bookings.filter(booking => {
    const startDate = new Date(booking.start)
    return startDate > now
  })

  async function loadData() {
    setIsLoading(true)
    setError("")
    
    try {
      // Load food truck
      const foodTruckResult = await getUserFoodTruck()
      if (foodTruckResult.success) {
        setFoodTruck(foodTruckResult.data)
        
        // If the user has a food truck, load its bookings
        if (foodTruckResult.data) {
          const bookingsResult = await getFoodTruckBookings(foodTruckResult.data.id)
          if (bookingsResult.success) {
            setBookings(bookingsResult.data || [])
          }
        }
      }
      
      // Load booking rules
      const rulesResult = await getBookingRules()
      if (rulesResult.success && rulesResult.data) {
        setBookingRules(rulesResult.data)
      }
    } catch (err) {
      console.error("Error loading dashboard data:", err)
      setError("Failed to load dashboard data")
    } finally {
      setIsLoading(false)
    }
  }

  // Handle booking cancellation
  const handleCancelBooking = async (bookingId: string) => {
    try {
      // Show loading toast
      const toastId = showToast("Canceling booking...", "loading", 0)
      
      const result = await cancelBooking(bookingId)
      
      if (result.success) {
        // Update toast to success
        updateToast(toastId, {
          message: "Booking canceled successfully!",
          type: "success",
          duration: 3000
        })
        // Reload data to reflect changes
        loadData()
      } else {
        // Update toast to error
        updateToast(toastId, {
          message: result.error || "Failed to cancel booking",
          type: "error",
          duration: 5000
        })
      }
    } catch (err) {
      console.error("Error canceling booking:", err)
      showToast(
        err instanceof Error ? err.message : "Failed to cancel booking", 
        "error"
      )
    }
  }

  // Load data on component mount
  useEffect(() => {
    loadData()
  }, [])

  return (
    <ProtectedRoute>
      <div className="min-h-screen p-8">
        <header className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold">Food Truck Dashboard</h1>
            <p className="text-muted-foreground">Welcome, {user?.first_name || user?.email}</p>
          </div>
          <div className="flex items-center gap-4">
            <Button onClick={() => router.push('/booking')}>
              Book a Space
            </Button>
            <Button variant="outline" onClick={logout}>
              Logout
            </Button>
          </div>
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
        
        <ToastContainer />

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : (
          <main className="container mx-auto">
            <Tabs defaultValue="dashboard" value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-6">
                <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
                <TabsTrigger value="profile">Food Truck Profile</TabsTrigger>
                <TabsTrigger value="bookings">My Bookings</TabsTrigger>
              </TabsList>
              
              <TabsContent value="dashboard">
                <div className="grid gap-6 md:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle>Food Truck Summary</CardTitle>
                      <CardDescription>Quick overview of your food truck</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {foodTruck ? (
                        <div className="space-y-2">
                          <div>
                            <span className="font-medium">Name:</span> {foodTruck.name}
                          </div>
                          <div>
                            <span className="font-medium">Current Bookings:</span> {currentBookings.length}
                          </div>
                          <div>
                            <span className="font-medium">Upcoming Bookings:</span> {upcomingBookings.length}
                          </div>
                          <div>
                            <span className="font-medium">Max Future Bookings:</span> {bookingRules.maximum_future_bookings}
                          </div>
                          <div>
                            <span className="font-medium">Bookings Available:</span> {Math.max(0, bookingRules.maximum_future_bookings - upcomingBookings.length)}
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-4">
                          <p className="text-muted-foreground">No food truck found.</p>
                          <p className="text-muted-foreground">Please set up your food truck profile.</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle>Current Activity</CardTitle>
                      <CardDescription>Your ongoing bookings</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {currentBookings.length > 0 ? (
                        <div className="space-y-4">
                          {currentBookings.map((booking, index) => (
                            <div key={index} className="border rounded-md p-3">
                              <div className="font-medium">{booking.space.name}</div>
                              <div className="text-sm text-muted-foreground">
                                {new Date(booking.start).toLocaleString()} - {new Date(booking.end).toLocaleString()}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-4">
                          <p className="text-muted-foreground">No current bookings.</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
                
                <div className="mt-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Upcoming Bookings</CardTitle>
                      <CardDescription>Your scheduled future bookings</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {upcomingBookings.length > 0 ? (
                        <div className="space-y-4">
                          {upcomingBookings.map((booking, index) => (
                            <div key={index} className="border rounded-md p-3 flex justify-between items-center">
                              <div>
                                <div className="font-medium">{booking.space.name}</div>
                                <div className="text-sm text-muted-foreground">
                                  {new Date(booking.start).toLocaleString()} - {new Date(booking.end).toLocaleString()}
                                </div>
                              </div>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => {
                                  // Optimistic UI update
                                  setBookings(prevBookings => 
                                    prevBookings.filter(b => b.id !== booking.id)
                                  );
                                  // Call the actual action
                                  handleCancelBooking(booking.id);
                                }}
                              >
                                Cancel
                              </Button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-4">
                          <p className="text-muted-foreground">No upcoming bookings.</p>
                          <Button
                            onClick={() => router.push('/booking')}
                            className="mt-2"
                          >
                            Book a Space
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
              
              <TabsContent value="profile">
                <div className="max-w-3xl mx-auto">
                  <FoodTruckDetails foodTruck={foodTruck} onUpdate={loadData} />
                </div>
              </TabsContent>
              
              <TabsContent value="bookings">
                <div className="grid gap-6 md:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle>Booking Rules</CardTitle>
                      <CardDescription>The rules that apply to all bookings</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <BookingRules rules={bookingRules} />
                    </CardContent>
                  </Card>
                  
                  <div className="space-y-6">
                    <BookingList
                      bookings={currentBookings}
                      title="Current Bookings"
                      description="Food truck spots you're currently occupying"
                      emptyMessage="You have no current bookings."
                    />
                    
                    <BookingList
                      bookings={upcomingBookings}
                      title="Upcoming Bookings"
                      description="Your future bookings"
                      emptyMessage="You have no upcoming bookings."
                      onCancel={handleCancelBooking}
                    />
                  </div>
                </div>
                
                <div className="mt-6 flex justify-center">
                  <Button
                    size="lg"
                    onClick={() => router.push('/booking')}
                  >
                    Book a New Space
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </main>
        )}
      </div>
    </ProtectedRoute>
  )
}