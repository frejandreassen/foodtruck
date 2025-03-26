"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface BookingRulesProps {
  rules: {
    maximum_future_bookings: number
    maximum_days_ahead: number
  }
}

export function BookingRules({ rules }: BookingRulesProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Booking Rules</CardTitle>
        <CardDescription>These rules apply to all food truck bookings</CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="list-disc pl-5 space-y-2">
          <li>
            Maximum {rules.maximum_future_bookings} future bookings allowed per food truck
          </li>
          <li>
            You can book up to {rules.maximum_days_ahead} days in advance
          </li>
        </ul>
      </CardContent>
    </Card>
  )
}