"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ProtectedRoute } from "@/components/protected-route"
import { SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { CustomSidebarTrigger } from "@/components/custom-sidebar-trigger"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Soup, MapPin, Clock, Search, Calendar, ArrowRight, Menu } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { getAllFoodTrucks } from "@/app/actions"

export default function FoodTrucksListPage() {
  const { user, logout } = useAuth()
  const router = useRouter()
  const [foodTrucks, setFoodTrucks] = useState<any[]>([])
  const [filteredFoodTrucks, setFilteredFoodTrucks] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")

  const loadFoodTrucks = async () => {
    setIsLoading(true)
    setError("")
    
    try {
      const foodTrucksResult = await getAllFoodTrucks()
      if (foodTrucksResult.success) {
        const foodTrucksData = foodTrucksResult.data || []
        setFoodTrucks(foodTrucksData)
        setFilteredFoodTrucks(foodTrucksData)
      } else if (foodTrucksResult.error) {
        console.error("Error loading food trucks:", foodTrucksResult.error)
        if (foodTrucksResult.error.includes("Invalid email or password") || 
            foodTrucksResult.error.includes("Not authenticated")) {
          setError("Authentication error. Please log in again.")
        } else {
          setError(`Failed to load food trucks: ${foodTrucksResult.error}`)
        }
      }
    } catch (err) {
      console.error("Error loading food trucks:", err)
      if (err instanceof Error && 
          (err.message.includes("Invalid email or password") || 
           err.message.includes("Not authenticated"))) {
        setError("Authentication error. Please log in again.")
      } else {
        setError("Failed to load food trucks data")
      }
    } finally {
      setIsLoading(false)
    }
  }

  // Handle search
  const handleSearch = (query: string) => {
    setSearchQuery(query)
    
    if (!query.trim()) {
      setFilteredFoodTrucks(foodTrucks)
      return
    }
    
    const filtered = foodTrucks.filter(truck => 
      truck.name?.toLowerCase().includes(query.toLowerCase()) ||
      (truck.description && truck.description.toLowerCase().includes(query.toLowerCase()))
    )
    
    setFilteredFoodTrucks(filtered)
  }

  // Load data on component mount
  useEffect(() => {
    loadFoodTrucks()
  }, [])

  return (
    <ProtectedRoute>
      <SidebarProvider>
        <div className="flex h-screen w-full">
          <AppSidebar />
          <div className="flex-1 p-4 md:p-6 overflow-auto w-full">
            <CustomSidebarTrigger />
            <header className="flex justify-between items-center mb-8">
              <div>
                <div className="flex items-center gap-2">
                  <Soup size={24} className="text-primary mr-2" />
                  <h1 className="text-2xl font-bold">Food Trucks</h1>
                </div>
                <p className="text-muted-foreground">View all registered food trucks</p>
              </div>
              <Button
                onClick={() => router.push('/dashboard')}
                className="hidden md:flex items-center"
              >
                <Calendar className="mr-2 h-4 w-4" />
                Dashboard
              </Button>
            </header>

            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6">
                <p className="mb-2">{error}</p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={loadFoodTrucks}
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
                  placeholder="Search food trucks by name..."
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
            ) : filteredFoodTrucks.length === 0 ? (
              <div className="text-center py-12">
                <Soup className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No food trucks found</h3>
                <p className="text-muted-foreground mb-6">
                  {searchQuery ? "No food trucks match your search criteria" : "There are no food trucks registered at the moment"}
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
                {filteredFoodTrucks.map(truck => (
                  <Card key={truck.id} className="overflow-hidden">
                    <div className="h-64 bg-muted relative overflow-hidden">
                      {truck.image ? (
                        <img 
                          src={`${process.env.NEXT_PUBLIC_DIRECTUS_URL || 'https://cms.businessfalkenberg.se'}/assets/${truck.image}`}
                          alt={truck.name}
                          className="absolute inset-0 w-full h-full object-cover object-center"
                          onError={(e) => {
                            // On error, replace with placeholder
                            (e.target as HTMLImageElement).src = '/food-truck-logo.svg';
                          }}
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Soup className="h-16 w-16 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <CardHeader className="pb-2">
                      <CardTitle>{truck.name}</CardTitle>
                      {truck.description && (
                        <CardDescription>
                          {truck.description.length > 200 
                            ? `${truck.description.substring(0, 200)}...` 
                            : truck.description}
                        </CardDescription>
                      )}
                    </CardHeader>
                    <CardContent className="pb-2">
                      <div className="space-y-2">
                        {truck.user && (
                          <div className="flex items-start gap-2">
                            <Clock className="h-4 w-4 text-muted-foreground mt-0.5" />
                            <div>
                              <span className="text-sm font-medium">Owner:</span>
                              <p className="text-sm text-muted-foreground">
                                {truck.user.first_name} {truck.user.last_name}
                              </p>
                            </div>
                          </div>
                        )}
                        
                        {truck.bookings && (
                          <div className="flex items-start gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
                            <div>
                              <span className="text-sm font-medium">Bookings:</span>
                              <p className="text-sm text-muted-foreground">
                                {truck.bookings.length} bookings
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
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