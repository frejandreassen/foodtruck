"use client"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarTrigger,
  useSidebar
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import Image from "next/image"
import { useRouter, usePathname } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Soup, Home, User, KeyRound, LogOut, Calendar, MapPin, List, Menu } from "lucide-react"

// Sidebar component doesn't need props but might in the future

export function AppSidebar() {
  const router = useRouter()
  const pathname = usePathname()
  const { user, logout } = useAuth()
  const sidebarContext = useSidebar()
  const state = sidebarContext?.state
  
  // Helper function to check if a route is active
  const isActive = (path: string | string[]) => {
    if (!pathname) return false
    const paths = Array.isArray(path) ? path : [path]
    
    return paths.some(p => {
      // Exact match
      if (pathname === p) return true
      // Check if it's a root path that should match subpaths
      if (p.endsWith('/') && pathname.startsWith(p)) return true
      // Check for routes with IDs and subpaths
      if (p.includes('[id]') && pathname.match(new RegExp(p.replace('[id]', '[^/]+'))))
        return true
      return false
    })
  }

  // We need to use the context's toggleSidebar method 
  // rather than props that aren't in the component interface
  return (
    <Sidebar className="w-[280px] max-w-[280px]" collapsible="icon">
      <SidebarHeader className="p-4 border-b">
        <div className="flex items-center gap-2 justify-between">
          <div className="flex items-center gap-2">
            <Soup size={24} className="text-primary" />
            <span className={cn("font-semibold", state === "collapsed" && "hidden")}>Food Truck App</span>
          </div>
          <SidebarTrigger 
            className="flex h-8 w-8 bg-muted hover:bg-muted-foreground/10" 
          />
        </div>
      </SidebarHeader>
      <SidebarContent className="p-4">
        <SidebarGroup className="mb-6">
          {state === "expanded" && <h3 className="text-sm font-medium mb-2 text-muted-foreground">Menu</h3>}
          <div className="space-y-1">
            <Button
              variant={isActive("/dashboard") ? "default" : "ghost"}
              className={cn(
                "w-full",
                state === "expanded" ? "justify-start" : "justify-center",
                isActive("/dashboard") && "bg-primary text-primary-foreground hover:bg-primary/90"
              )}
              onClick={() => router.push("/dashboard")}
            >
              <Home size={16} className={state === "expanded" ? "mr-2" : ""} />
              {state === "expanded" && "Dashboard"}
            </Button>
            <Button
              variant={isActive(["/foodtrucks", "/foodtrucks/"]) ? "default" : "ghost"}
              className={cn(
                "w-full",
                state === "expanded" ? "justify-start" : "justify-center",
                isActive(["/foodtrucks", "/foodtrucks/"]) && "bg-primary text-primary-foreground hover:bg-primary/90"
              )}
              onClick={() => router.push("/foodtrucks")}
            >
              <Soup size={16} className={state === "expanded" ? "mr-2" : ""} />
              {state === "expanded" && "Food Trucks"}
            </Button>
            <Button
              variant={isActive(["/spaces", "/spaces/"]) ? "default" : "ghost"}
              className={cn(
                "w-full",
                state === "expanded" ? "justify-start" : "justify-center",
                isActive(["/spaces", "/spaces/"]) && "bg-primary text-primary-foreground hover:bg-primary/90"
              )}
              onClick={() => router.push("/spaces")}
            >
              <List size={16} className={state === "expanded" ? "mr-2" : ""} />
              {state === "expanded" && "Spaces List"}
            </Button>
            <Button
              variant={isActive("/spaces-overview") ? "default" : "ghost"}
              className={cn(
                "w-full",
                state === "expanded" ? "justify-start" : "justify-center",
                isActive("/spaces-overview") && "bg-primary text-primary-foreground hover:bg-primary/90"
              )}
              onClick={() => router.push("/spaces-overview")}
            >
              <MapPin size={16} className={state === "expanded" ? "mr-2" : ""} />
              {state === "expanded" && "Spaces Map"}
            </Button>
            <Button
              variant={isActive("/booking") ? "default" : "ghost"}
              className={cn(
                "w-full",
                state === "expanded" ? "justify-start" : "justify-center",
                isActive("/booking") && "bg-primary text-primary-foreground hover:bg-primary/90"
              )}
              onClick={() => router.push("/booking")}
            >
              <Calendar size={16} className={state === "expanded" ? "mr-2" : ""} />
              {state === "expanded" && "Book a Space"}
            </Button>
            <Button
              variant={isActive("/login") ? "default" : "ghost"}
              className={cn(
                "w-full",
                state === "expanded" ? "justify-start" : "justify-center",
                isActive("/login") && "bg-primary text-primary-foreground hover:bg-primary/90"
              )}
              onClick={() => router.push("/login")}
            >
              <User size={16} className={state === "expanded" ? "mr-2" : ""} />
              {state === "expanded" && "Profile"}
            </Button>
          </div>
        </SidebarGroup>
        <SidebarGroup>
          {state === "expanded" && <h3 className="text-sm font-medium mb-2 text-muted-foreground">Account</h3>}
          <div className="space-y-1">
            <Button
              variant={isActive("/auth/password-request") ? "default" : "ghost"}
              className={cn(
                "w-full",
                state === "expanded" ? "justify-start" : "justify-center",
                isActive("/auth/password-request") && "bg-primary text-primary-foreground hover:bg-primary/90"
              )}
              onClick={() => router.push("/auth/password-request")}
            >
              <KeyRound size={16} className={state === "expanded" ? "mr-2" : ""} />
              {state === "expanded" && "Change Password"}
            </Button>
            <Button
              variant="ghost"
              className={cn(
                "w-full text-red-500 hover:bg-red-100 hover:text-red-600",
                state === "expanded" ? "justify-start" : "justify-center"
              )}
              onClick={logout}
            >
              <LogOut size={16} className={state === "expanded" ? "mr-2" : ""} />
              {state === "expanded" && "Logout"}
            </Button>
          </div>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-4 border-t">
        {user && state === "expanded" && (
          <div className="flex flex-col">
            <span className="text-sm font-medium">{user.first_name} {user.last_name}</span>
            <span className="text-xs text-muted-foreground">{user.email}</span>
          </div>
        )}
        {user && state === "collapsed" && (
          <div className="flex justify-center">
            <User size={16} className="text-muted-foreground" />
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  )
}