"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { ProtectedRoute } from "@/components/protected-route"
import { SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Soup, MapPin, Clock, Calendar, ChevronLeft, ListChecks, Menu, Home, User, List } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { getAllSpaces } from "@/app/actions"
import SpacesMap from "@/components/spaces-map"

export default function SpaceDetailsPage() {
  const params = useParams<{id: string}>()
  const { user, logout } = useAuth()
  const router = useRouter()
  const [space, setSpace] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")

  const loadSpaceDetails = async () => {
    setIsLoading(true)
    setError("")
    
    try {
      // Get the space ID from the route params
      const spaceId = params.id
      
      if (!spaceId) {
        setError("Space ID is missing")
        setIsLoading(false)
        return
      }
      
      // Load all spaces and find the specific one
      // Note: In a real app, you'd have a getSpaceById API
      const spacesResult = await getAllSpaces()
      
      if (spacesResult.success) {
        const spaceData = spacesResult.data?.find(s => String(s.id) === spaceId)
        
        if (spaceData) {
          setSpace(spaceData)
        } else {
          setError("Space not found")
        }
      } else if (spacesResult.error) {
        console.error("Error loading space:", spacesResult.error)
        if (spacesResult.error.includes("Invalid email or password") || 
            spacesResult.error.includes("Not authenticated")) {
          setError("Authentication error. Please log in again.")
        } else {
          setError(`Failed to load space: ${spacesResult.error}`)
        }
      }
    } catch (err) {
      console.error("Error loading space details:", err)
      if (err instanceof Error && 
          (err.message.includes("Invalid email or password") || 
           err.message.includes("Not authenticated"))) {
        setError("Authentication error. Please log in again.")
      } else {
        setError("Failed to load space details")
      }
    } finally {
      setIsLoading(false)
    }
  }

  // Get map center from space location
  const getMapCenter = () => {
    if (space?.location?.coordinates) {
      // Convert from [longitude, latitude] to {lat, lng}
      return {
        lat: space.location.coordinates[1],
        lng: space.location.coordinates[0]
      }
    }
    
    // Default to Falkenberg, Sweden
    return { lat: 56.9055, lng: 12.4912 }
  }

  // Load data on component mount
  useEffect(() => {
    loadSpaceDetails()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id])

  return (
    <ProtectedRoute>
      <SidebarProvider>
        <div className="flex h-screen w-full">
          <AppSidebar />
          <div className="flex-1 p-4 md:p-6 overflow-auto w-full">
            <header className="flex justify-between items-center mb-8">
              <div className="flex items-center gap-2">
                <Soup size={24} className="text-primary mr-2" />
                <div>
                  <h1 className="text-2xl font-bold flex items-center gap-2">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8"
                      onClick={() => router.push('/spaces-list')}
                    >
                      <ChevronLeft className="h-5 w-5" />
                      <span className="sr-only">Back</span>
                    </Button>
                    {isLoading ? "Loading..." : space?.name || "Space Not Found"}
                  </h1>
                  <p className="text-muted-foreground">View space details and availability</p>
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => router.push('/spaces-list')}
                >
                  <ListChecks className="mr-2 h-4 w-4" />
                  All Spaces
                </Button>
                
                <Button
                  onClick={() => router.push('/booking')}
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  Book Space
                </Button>
              </div>
            </header>

            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6">
                <p className="mb-2">{error}</p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={loadSpaceDetails}
                  >
                    Try again
                  </Button>
                  {error.includes("Authentication") && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        logout();
                        router.push("/login");
                      }}
                    >
                      Return to login
                    </Button>
                  )}
                </div>
              </div>
            )}

            {isLoading ? (
              <div className="flex justify-center items-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              </div>
            ) : space ? (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6 w-full">
                {/* Space Details Column */}
                <div className="lg:col-span-1">
                  <Card className="h-full">
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <MapPin className="mr-2 h-5 w-5" />
                        Space Information
                      </CardTitle>
                      <CardDescription>
                        Details about this food truck space
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div>
                        {space.image && (
                          <div className="mb-4 rounded-md overflow-hidden">
                            <img 
                              src={`${process.env.NEXT_PUBLIC_DIRECTUS_URL || 'https://cms.businessfalkenberg.se'}/assets/${space.image}`}
                              alt={space.name}
                              className="w-full h-48 object-cover"
                              onError={(e) => {
                                // On error, replace with placeholder
                                (e.target as HTMLImageElement).src = '/placeholder.svg';
                              }}
                            />
                          </div>
                        )}
                        <h3 className="text-lg font-medium">{space.name}</h3>
                        <p className="text-muted-foreground">
                          {space.description || "No description available"}
                        </p>
                      </div>

                      <Separator />

                      <div>
                        <h4 className="font-medium flex items-center mb-2">
                          <Clock className="mr-2 h-4 w-4" />
                          Available Time Slots
                        </h4>
                        
                        {space.time_slots && space.time_slots.length > 0 ? (
                          <div className="space-y-2">
                            {space.time_slots.map((slot: any, index: number) => (
                              <div key={index} className="bg-muted p-3 rounded-md">
                                <div className="font-medium">{slot.description}</div>
                                <div className="text-sm text-muted-foreground">
                                  {slot.start.substring(0, 5)} - {slot.end.substring(0, 5)}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-muted-foreground">No defined time slots</p>
                        )}
                      </div>

                      <Separator />

                      <div>
                        <h4 className="font-medium flex items-center mb-2">
                          <Calendar className="mr-2 h-4 w-4" />
                          Booking Information
                        </h4>
                        
                        {space.bookings ? (
                          <div className="space-y-2">
                            <p className="text-sm">
                              <span className="font-medium">Total Bookings:</span> {space.bookings.length}
                            </p>
                          </div>
                        ) : (
                          <p className="text-muted-foreground">No bookings information available</p>
                        )}
                      </div>

                      <Separator />

                      <div>
                        <h4 className="font-medium flex items-center mb-2">
                          <MapPin className="mr-2 h-4 w-4" />
                          Location
                        </h4>
                        <p className="text-muted-foreground">
                          {space.location ? 
                            typeof space.location === 'object' ?
                              space.location.coordinates ? 
                                `Coordinates: ${space.location.coordinates[1].toFixed(6)}, ${space.location.coordinates[0].toFixed(6)}` :
                                "Location data available" :
                              String(space.location) :
                            "No location specified"}
                        </p>
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Button
                        onClick={() => router.push('/booking')}
                        className="w-full"
                      >
                        Book This Space
                      </Button>
                    </CardFooter>
                  </Card>
                </div>

                {/* Map Column */}
                <div className="lg:col-span-2">
                  <Card className="h-full">
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <MapPin className="mr-2 h-5 w-5" />
                        Location Map
                      </CardTitle>
                      <CardDescription>
                        Map showing the location of this space
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                      {space.location && space.location.coordinates ? (
                        <SpacesMap 
                          spaces={[space]} 
                          center={getMapCenter()}
                          zoom={19}
                          height="65vh"
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center h-64 bg-muted">
                          <MapPin className="h-12 w-12 text-muted-foreground mb-4" />
                          <p className="text-muted-foreground">
                            No location coordinates available for this space
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <MapPin className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Space Not Found</h3>
                <p className="text-muted-foreground mb-6">
                  The space you're looking for doesn't exist or might have been removed
                </p>
                <Button
                  onClick={() => router.push('/spaces-list')}
                >
                  View All Spaces
                </Button>
              </div>
            )}
          </div>
        </div>
      </SidebarProvider>
    </ProtectedRoute>
  )
}