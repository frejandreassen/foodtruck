"use client"

import { CircleCheck, AlertCircle, Clock } from "lucide-react"

interface BookingStatusIndicatorProps {
  hasReachedMaxBookings: () => boolean;
  isLastMinuteBooking: (timeSlot: any) => boolean;
  timeSlot: any;
  bookingRules: any;
  futureBookings: number;
}

export function BookingStatusIndicator({
  hasReachedMaxBookings,
  isLastMinuteBooking,
  timeSlot,
  bookingRules,
  futureBookings
}: BookingStatusIndicatorProps) {
  const maxBookings = bookingRules?.maximum_future_bookings || 0;
  
  // If we haven't reached max bookings, show a success indicator
  if (!hasReachedMaxBookings()) {
    return (
      <div className="mt-3 p-3 rounded-md bg-green-50 border border-green-200">
        <div className="flex items-start gap-2">
          <CircleCheck className="h-4 w-4 text-green-500 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-green-800">
              Booking available
            </p>
            <p className="text-xs text-green-600 mt-1">
              <span className="font-medium">{futureBookings} of {maxBookings}</span> future bookings used
            </p>
          </div>
        </div>
      </div>
    );
  }
  
  // If at max bookings but it's a last-minute booking (only check if timeSlot exists)
  if (timeSlot && isLastMinuteBooking(timeSlot)) {
    return (
      <div className="mt-3 p-3 rounded-md bg-blue-50 border border-blue-200">
        <div className="flex items-start gap-2">
          <Clock className="h-4 w-4 text-blue-500 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-blue-800">
              Last-minute booking available
            </p>
            <p className="text-xs text-blue-600 mt-1">
              <span className="font-medium">{futureBookings} of {maxBookings}</span> future bookings used - 
              within {bookingRules?.last_minute_booking_hours || 24}h window
            </p>
          </div>
        </div>
      </div>
    );
  }
  
  // At max bookings and not a last-minute booking
  return (
    <div className="mt-3 p-3 rounded-md bg-amber-50 border border-amber-200">
      <div className="flex items-start gap-2">
        <AlertCircle className="h-4 w-4 text-amber-500 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-amber-800">
            Maximum bookings reached
          </p>
          <p className="text-xs text-amber-600 mt-1">
            <span className="font-medium">{futureBookings} of {maxBookings}</span> future bookings used - 
            try last-minute booking (within {bookingRules?.last_minute_booking_hours || 24}h)
          </p>
        </div>
      </div>
    </div>
  );
}