"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ProtectedRoute } from "@/components/protected-route"
import { SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Soup, MapPin, PanelLeftIcon } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { getAllSpaces } from "@/app/actions"
import SpacesMap from "@/components/spaces-map"

export default function SpacesOverviewPage() {
  const { user, logout } = useAuth()
  const router = useRouter()
  const [spaces, setSpaces] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [openMobileMenu, setOpenMobileMenu] = useState(false)
  // No need to track selected space state anymore

  // Default center for the map (Falkenberg, Sweden)
  const defaultCenter = { lat: 56.9055, lng: 12.4912 }

  const loadSpaces = async () => {
    setIsLoading(true)
    setError("")
    
    try {
      const spacesResult = await getAllSpaces()
      if (spacesResult.success) {
        setSpaces(spacesResult.data || [])
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

  // Helper function to handle space selection - just navigate directly
  const handleSpaceSelect = (space: any) => {
    // Navigate to space details page
    router.push(`/spaces/${space.id}`)
  }

  // Load data on component mount
  useEffect(() => {
    loadSpaces()
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
                  <h1 className="text-2xl font-bold">Spaces Overview</h1>
                </div>
                <p className="text-muted-foreground">View all available food truck spaces on the map</p>
              </div>
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

            {isLoading ? (
              <div className="flex justify-center items-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              </div>
            ) : (
              <Card className="h-full">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <MapPin className="mr-2 h-5 w-5" />
                    Food Truck Spaces
                  </CardTitle>
                  <CardDescription>
                    Interactive map showing all available food truck spaces
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <SpacesMap 
                    spaces={spaces} 
                    center={defaultCenter}
                    height="70vh"
                    onSpaceSelect={handleSpaceSelect}
                  />
                </CardContent>
                <CardFooter className="text-xs text-muted-foreground">
                  Click on a marker to view space details. Total spaces: {spaces.length}
                </CardFooter>
              </Card>
            )}
          </div>
        </div>
      </SidebarProvider>
    </ProtectedRoute>
  )
}