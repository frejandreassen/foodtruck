"use client"

import { useEffect } from "react"
import { clientEnv } from "@/lib/env"

export function EnvProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Make environment variables available globally
    window.ENV = {
      DIRECTUS_URL: clientEnv.DIRECTUS_URL,
      APP_URL: clientEnv.APP_URL
    }
    
    // Log env vars for debugging
    console.log("Environment variables loaded:", {
      DIRECTUS_URL: clientEnv.DIRECTUS_URL,
      APP_URL: clientEnv.APP_URL
    })
  }, [])

  return <>{children}</>
}