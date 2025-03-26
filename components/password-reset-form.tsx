"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { resetPassword } from "@/app/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface PasswordResetFormProps extends React.ComponentProps<"form"> {
  token: string
}

export function PasswordResetForm({
  className,
  token,
  ...props
}: PasswordResetFormProps) {
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsLoading(true)
    setError("")
    setSuccess(false)

    if (password !== confirmPassword) {
      setError("Passwords do not match")
      setIsLoading(false)
      return
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters long")
      setIsLoading(false)
      return
    }

    if (!token) {
      setError("Reset token is missing")
      setIsLoading(false)
      return
    }

    try {
      const result = await resetPassword(token, password)

      if (result.success) {
        setSuccess(true)
        
        // Redirect to login page after 2 seconds
        setTimeout(() => {
          router.push("/login")
        }, 2000)
      } else {
        setError(result.error || "An error occurred")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form 
      className={cn("flex flex-col gap-6", className)} 
      onSubmit={handleSubmit}
      {...props}
    >
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-2xl font-bold">Reset your password</h1>
        <p className="text-muted-foreground text-sm text-balance">
          Enter your new password below
        </p>
      </div>
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative">
          Password has been reset successfully. Redirecting to login...
        </div>
      )}
      <div className="grid gap-6">
        <div className="grid gap-3">
          <Label htmlFor="password">New Password</Label>
          <Input 
            id="password" 
            type="password" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required 
            minLength={8}
          />
        </div>
        <div className="grid gap-3">
          <Label htmlFor="confirmPassword">Confirm New Password</Label>
          <Input 
            id="confirmPassword" 
            type="password" 
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required 
            minLength={8}
          />
        </div>
        <Button type="submit" className="w-full" disabled={isLoading || !token}>
          {isLoading ? "Resetting..." : "Reset Password"}
        </Button>
        <div className="text-center">
          <a 
            href="/login" 
            className="text-sm text-blue-600 hover:underline"
          >
            Back to login
          </a>
        </div>
      </div>
    </form>
  )
}