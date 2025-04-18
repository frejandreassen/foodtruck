"use client"

import { useState } from "react"
import { ProtectedRoute } from "@/components/protected-route"
import { SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { CustomSidebarTrigger } from "@/components/custom-sidebar-trigger"
import { SpaceForm } from "@/components/space-form"
import { Toaster } from "@/components/ui/toaster"
import { Button } from "@/components/ui/button"
import { Menu } from "lucide-react"

export default function SpacesPage() {
  
  return (
    <ProtectedRoute>
      <SidebarProvider>
        <div className="flex h-screen">
          <AppSidebar />
          <div className="flex-1 p-6 overflow-auto">
            <CustomSidebarTrigger />
            <header className="flex justify-between items-center mb-8">
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold">Manage Spaces</h1>
                </div>
                <p className="text-muted-foreground">Edit space details and time slots</p>
              </div>
            </header>

            <div className="max-w-4xl mx-auto">
              <SpaceForm />
            </div>
          </div>
        </div>
        <Toaster />
      </SidebarProvider>
    </ProtectedRoute>
  )
}