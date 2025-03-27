"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ProtectedRoute } from "@/components/protected-route"
import { SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Soup, MapPin, Clock, Search, Calendar, ArrowRight } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { getAllSpaces } from "@/app/actions"

export default function SpacesListPage() {
  const { user, logout } = useAuth()
  const router = useRouter()
  const [spaces, setSpaces] = useState<any[]>([])
  const [filteredSpaces, setFilteredSpaces] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")

  const loadSpaces = async () => {
    setIsLoading(true)
    setError("")
    
    try {
      const spacesResult = await getAllSpaces()
      if (spacesResult.success) {
        const spacesData = spacesResult.data || []
        setSpaces(spacesData)
        setFilteredSpaces(spacesData)
      } else if (spacesResult.error) {
        console.error("Error loading spaces:", spacesResult.error)
        if (spacesResult.error.includes("Invalid email or password") || 
            spacesResult.error.includes("Not authenticated")) {
          setError("Authentication error. Please log in again.")
        } else {
          setError(`Failed to load spaces: ${spacesResult.error}`)
        }
      }
    } catch (err) {
      console.error("Error loading spaces:", err)
      if (err instanceof Error && 
          (err.message.includes("Invalid email or password") || 
           err.message.includes("Not authenticated"))) {
        setError("Authentication error. Please log in again.")
      } else {
        setError("Failed to load spaces data")
      }
    } finally {
      setIsLoading(false)
    }
  }

  // Handle search
  const handleSearch = (query: string) => {
    setSearchQuery(query)
    
    if (!query.trim()) {
      setFilteredSpaces(spaces)
      return
    }
    
    const filtered = spaces.filter(space => 
      space.name.toLowerCase().includes(query.toLowerCase()) ||
      (space.description && space.description.toLowerCase().includes(query.toLowerCase()))
    )
    
    setFilteredSpaces(filtered)
  }

  // Handle view space details
  const handleViewSpaceDetails = (spaceId: string | number) => {
    router.push(`/spaces/${spaceId}`)
  }

  // Load data on component mount
  useEffect(() => {
    loadSpaces()
  }, [])

  return (
    <ProtectedRoute>
      <SidebarProvider>
        <div className="flex h-screen w-full">
          <AppSidebar />
          <div className="flex-1 p-4 md:p-6 overflow-auto w-full">
            <header className="flex justify-between items-center mb-8">
              <div>
                <div className="flex items-center gap-2">
                  <Soup size={24} className="text-primary mr-2" />
                  <h1 className="text-2xl font-bold">All Spaces</h1>
                </div>
                <p className="text-muted-foreground">Browse and view all available food truck spaces</p>
              </div>
              <Button
                onClick={() => router.push('/spaces-overview')}
                className="hidden md:flex items-center"
              >
                <MapPin className="mr-2 h-4 w-4" />
                View Map
              </Button>
            </header>

            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6">
                <p className="mb-2">{error}</p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={loadSpaces}
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

            <div className="mb-6 max-w-md">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search spaces by name..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                />
              </div>
            </div>

            {isLoading ? (
              <div className="flex justify-center items-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              </div>
            ) : filteredSpaces.length === 0 ? (
              <div className="text-center py-12">
                <MapPin className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No spaces found</h3>
                <p className="text-muted-foreground mb-6">
                  {searchQuery ? "No spaces match your search criteria" : "There are no spaces available at the moment"}
                </p>
                {searchQuery && (
                  <Button
                    variant="outline"
                    onClick={() => handleSearch("")}
                  >
                    Clear search
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredSpaces.map(space => (
                  <Card key={space.id} className="overflow-hidden">
                    <div className="h-40 bg-muted relative overflow-hidden">
                      {space.image ? (
                        <img 
                          src={`${process.env.NEXT_PUBLIC_DIRECTUS_URL || 'https://cms.businessfalkenberg.se'}/assets/${space.image}`}
                          alt={space.name}
                          className="absolute inset-0 w-full h-full object-cover"
                          onError={(e) => {
                            // On error, replace with placeholder
                            (e.target as HTMLImageElement).src = '/placeholder.svg';
                          }}
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <MapPin className="h-8 w-8 text-muted-foreground" />
                        </div>
                      )}
                      
                      {space.location && space.location.coordinates && (
                        <div className="absolute bottom-3 right-3 bg-background text-foreground px-2 py-1 rounded-md text-xs shadow-sm">
                          {space.location.type || "Location"} Available
                        </div>
                      )}
                    </div>
                    <CardHeader className="pb-2">
                      <CardTitle>{space.name}</CardTitle>
                      {space.description && (
                        <CardDescription>
                          {space.description.length > 100 
                            ? `${space.description.substring(0, 100)}...` 
                            : space.description}
                        </CardDescription>
                      )}
                    </CardHeader>
                    <CardContent className="pb-2">
                      <div className="space-y-2">
                        <div className="flex items-start gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground mt-0.5" />
                          <div>
                            <span className="text-sm font-medium">Time Slots:</span>
                            {space.time_slots && space.time_slots.length > 0 ? (
                              <ul className="text-sm text-muted-foreground mt-1">
                                {space.time_slots.map((slot: any, index: number) => (
                                  <li key={index}>
                                    {slot.description}: {slot.start.substring(0, 5)} - {slot.end.substring(0, 5)}
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              <p className="text-sm text-muted-foreground mt-1">No time slots defined</p>
                            )}
                          </div>
                        </div>
                        
                        {space.bookings && (
                          <div className="flex items-start gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
                            <div>
                              <span className="text-sm font-medium">Bookings:</span>
                              <p className="text-sm text-muted-foreground">
                                {space.bookings.length} existing bookings
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                    <CardFooter className="pt-2">
                      <div className="flex justify-end w-full">
                        <Button
                          variant="default"
                          size="sm"
                          className="w-full md:w-auto"
                          onClick={() => handleViewSpaceDetails(space.id)}
                        >
                          View Details
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </div>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </SidebarProvider>
    </ProtectedRoute>
  )
}