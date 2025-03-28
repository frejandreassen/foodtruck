"use client"

import { useSidebar } from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Menu } from "lucide-react"

export function CustomSidebarTrigger() {
  const { toggleSidebar, isMobile } = useSidebar()
  
  return (
    <Button
      variant="outline"
      size="icon"
      className="md:hidden mb-4"
      onClick={toggleSidebar}
    >
      <Menu className="h-4 w-4" />
    </Button>
  )
}