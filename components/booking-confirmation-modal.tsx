"use client"

import { format } from "date-fns"
import { useState } from "react"
import { Check, Clock, MapPin, Soup, Calendar as CalendarIcon, X } from "lucide-react"
import { BookingStatusIndicator } from "@/components/booking-status-indicator"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface BookingConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isBooking: boolean;
  space: any;
  foodTruck: any;
  date: Date;
  timeSlot: any;
  bookingRules: any;
  futureBookings: number;
  isLastMinuteBooking: (timeSlot: any) => boolean;
  hasReachedMaxBookings: () => boolean;
  error?: string;
}

export function BookingConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  isBooking,
  space,
  foodTruck,
  date,
  timeSlot,
  bookingRules,
  futureBookings,
  isLastMinuteBooking,
  hasReachedMaxBookings,
  error
}: BookingConfirmationModalProps) {
  console.log("=== BookingConfirmationModal render ===", { isOpen, isBooking, error })
  const isBookable = !hasReachedMaxBookings() || (timeSlot && isLastMinuteBooking(timeSlot));
  
  const handleOpenChange = (open: boolean) => {
    console.log("=== Dialog onOpenChange ===", { open, isBooking, hasError: !!error })
    // Don't allow closing while booking is in progress
    if (!open && isBooking) {
      console.log("Preventing close during booking")
      return
    }
    // When user explicitly clicks outside or presses escape, allow close
    if (!open) {
      console.log("Dialog closing via onOpenChange")
    }
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogTitle className="text-base font-medium mb-4">Confirm Booking</DialogTitle>
        
        <div className="space-y-3">
          <div className="p-3 bg-gray-50 rounded-md">
            <div className="flex items-start gap-2">
              <MapPin className="mt-0.5 text-primary" size={16} />
              <div>
                <p className="text-sm font-medium">{space?.name}</p>
                <p className="text-xs text-muted-foreground">
                  {space?.description && space.description.length > 120 
                    ? `${space.description.substring(0, 120)}...` 
                    : space?.description || "No description available"}
                </p>
              </div>
            </div>
          </div>
          
          <div className="p-3 bg-gray-50 rounded-md">
            <div className="flex items-start gap-2">
              <CalendarIcon className="mt-0.5 text-primary" size={16} />
              <div>
                <p className="text-sm font-medium">{date ? format(date, "EEEE, MMMM do, yyyy") : ""}</p>
                <p className="text-xs text-muted-foreground">
                  {timeSlot?.description || `${timeSlot?.start.substring(0, 5)} - ${timeSlot?.end.substring(0, 5)}`}
                </p>
              </div>
            </div>
          </div>
          
          <div className="p-3 bg-gray-50 rounded-md">
            <div className="flex items-start gap-2">
              <Soup className="mt-0.5 text-primary" size={16} />
              <div>
                <p className="text-sm font-medium">{foodTruck?.name}</p>
                <p className="text-xs text-muted-foreground">Your food truck</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Booking status indicator */}
        <BookingStatusIndicator
          hasReachedMaxBookings={hasReachedMaxBookings}
          isLastMinuteBooking={isLastMinuteBooking}
          timeSlot={timeSlot}
          bookingRules={bookingRules}
          futureBookings={futureBookings}
        />

        {/* Error message */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <div className="flex items-start gap-2">
              <X className="mt-0.5 text-red-500" size={16} />
              <div>
                <p className="text-sm font-medium text-red-700">Bokningen misslyckades</p>
                <p className="text-xs text-red-600">{error}</p>
              </div>
            </div>
          </div>
        )}

        <DialogFooter className="flex justify-end gap-2 mt-4">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isBooking}
            size="sm"
          >
            Cancel
          </Button>
          <Button
            variant={hasReachedMaxBookings() && timeSlot && isLastMinuteBooking(timeSlot) ? "secondary" : "default"}
            onClick={onConfirm}
            disabled={!isBookable || isBooking}
            size="sm"
          >
            {isBooking ? (
              <>
                <div className="mr-2 h-3 w-3 animate-spin rounded-full border-2 border-b-transparent"></div>
                Processing...
              </>
            ) : hasReachedMaxBookings() && timeSlot && isLastMinuteBooking(timeSlot) ? (
              <>
                <Clock className="mr-1.5 h-3 w-3" />
                Last-Minute
              </>
            ) : (
              <>
                <Check className="mr-1.5 h-3 w-3" />
                Confirm
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

