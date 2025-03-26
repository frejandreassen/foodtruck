"use client"

import { useSearchParams } from "next/navigation"
import Image from "next/image"
import { PasswordResetForm } from "@/components/password-reset-form"

export default function PasswordResetPage() {
  const searchParams = useSearchParams()
  const token = searchParams.get("token")

  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex justify-center gap-2 md:justify-start">
          <a href="/" className="flex items-center gap-2 font-medium">
            <Image 
              src="/food-truck-logo.svg" 
              alt="Food Truck Logo" 
              width={32} 
              height={32} 
              className="h-8 w-8"
            />
            <span>Food Truck</span>
          </a>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-xs">
            <PasswordResetForm token={token || ""} />
          </div>
        </div>
      </div>
      <div className="bg-muted relative hidden lg:block">
        <img
          src="/placeholder.svg"
          alt="Food Truck Login Image"
          className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
        />
      </div>
    </div>
  )
}