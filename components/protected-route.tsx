"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      // Save the current URL for redirecting back after login
      if (typeof window !== 'undefined') {
        const currentPath = window.location.pathname + window.location.search
        // Don't save login page itself to avoid redirect loops
        if (currentPath !== '/login') {
          sessionStorage.setItem('redirectAfterLogin', currentPath)
        }
      }
      router.push("/login")
    }
  }, [isAuthenticated, isLoading, router])

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return <>{children}</>
}