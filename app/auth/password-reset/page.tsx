"use client"

import { Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { PasswordResetForm } from "@/components/password-reset-form"
import { Soup } from "lucide-react"

function PasswordResetContent() {
  const searchParams = useSearchParams()
  const token = searchParams.get("token")
  
  return <PasswordResetForm token={token || ""} />
}

export default function PasswordResetPage() {

  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex justify-center gap-2 md:justify-start">
          <a href="/" className="flex items-center gap-2 font-medium">
            <div className="flex items-center gap-2">
              <Soup size={24} className="text-primary" />
              <span className="font-semibold">Food Truck App</span>
            </div>
          </a>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-xs">
            <Suspense fallback={<div>Loading...</div>}>
              <PasswordResetContent />
            </Suspense>
          </div>
        </div>
      </div>
      <div className="bg-muted relative hidden lg:block">
        <img
          src="https://cms.falkenberg.se/wp-content/uploads/2023/01/annies-stuga-10-768x512.jpg"
          alt="Food Truck Login Image"
          className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
        />
      </div>
    </div>
  )
}