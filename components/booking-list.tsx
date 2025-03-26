"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

interface Booking {
  id: string
  start: string
  end: string
  space: {
    id: string
    name: string
  }
}

interface BookingListProps {
  bookings: Booking[]
  title: string
  description: string
  emptyMessage: string
  onCancel?: (bookingId: string) => void
}

export function BookingList({ 
  bookings, 
  title, 
  description, 
  emptyMessage, 
  onCancel 
}: BookingListProps) {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return new Intl.DateTimeFormat("en-SE", {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
    }).format(date)
  }

  if (bookings.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">{emptyMessage}</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {bookings.map((booking) => (
            <div
              key={booking.id}
              className="border rounded-md p-4 flex justify-between items-center"
            >
              <div>
                <h3 className="font-medium">{booking.space.name}</h3>
                <div className="text-sm text-muted-foreground">
                  {formatDate(booking.start)} - {formatDate(booking.end)}
                </div>
              </div>
              {onCancel && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    // Call the cancel handler
                    onCancel(booking.id);
                  }}
                >
                  Cancel
                </Button>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}