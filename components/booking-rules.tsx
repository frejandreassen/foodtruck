"use client"

import { CircleCheck, AlertCircle, Clock, Calendar } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface BookingRulesProps {
  rules: {
    maximum_future_bookings: number;
    maximum_days_ahead: number;
    last_minute_booking_hours: number;
  } | null;
  futureBookings: number;
  isLoading?: boolean;
}

export function BookingRules({ rules, futureBookings, isLoading = false }: BookingRulesProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Booking Rules</CardTitle>
          <CardDescription>Loading...</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  if (!rules) {
    return null
  }

  const { maximum_future_bookings, maximum_days_ahead, last_minute_booking_hours } = rules
  const isAtMaxBookings = futureBookings >= maximum_future_bookings
  
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Booking Rules</CardTitle>
        <CardDescription>Booking limitations and availability</CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <ul className="space-y-2 text-sm">
          <li className="flex items-start gap-2">
            {isAtMaxBookings ? (
              <AlertCircle className="h-4 w-4 text-amber-500 mt-0.5" />
            ) : (
              <CircleCheck className="h-4 w-4 text-green-500 mt-0.5" />
            )}
            <span className={isAtMaxBookings ? "text-amber-700" : ""}>
              <span className="font-medium">{futureBookings} of {maximum_future_bookings} future bookings</span> used
              {isAtMaxBookings && (
                <span className="block text-xs text-amber-600 mt-0.5">
                  You&apos;ve reached your maximum number of future bookings. Cancel an existing booking to make a new one, or book a slot within {last_minute_booking_hours} hours.
                </span>
              )}
            </span>
          </li>
          <li className="flex items-start gap-2">
            <Calendar className="h-4 w-4 text-gray-500 mt-0.5" />
            <span>
              Bookings can be made up to <span className="font-medium">{maximum_days_ahead} days</span> in advance
            </span>
          </li>
          <li className="flex items-start gap-2">
            <Clock className="h-4 w-4 text-gray-500 mt-0.5" />
            <span>
              Last-minute bookings within <span className="font-medium">{last_minute_booking_hours} hours</span> are always available, even if you&apos;ve reached your maximum
            </span>
          </li>
        </ul>
      </CardContent>
    </Card>
  )
}