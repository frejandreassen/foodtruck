"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/components/ui/use-toast"

interface TimeSlot {
  id: string
  startTime: string
  endTime: string
}

export function SpaceForm() {
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [spaceType, setSpaceType] = useState("regular")
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([])
  const [newStartTime, setNewStartTime] = useState("09:00")
  const [newEndTime, setNewEndTime] = useState("17:00")
  const { toast } = useToast()

  const handleAddTimeSlot = () => {
    if (!newStartTime || !newEndTime) {
      toast({
        title: "Error",
        description: "Both start and end time are required.",
        variant: "destructive"
      })
      return
    }

    // Basic validation to ensure end time is after start time
    if (newStartTime >= newEndTime) {
      toast({
        title: "Error",
        description: "End time must be after start time.",
        variant: "destructive"
      })
      return
    }

    const newSlot: TimeSlot = {
      id: Date.now().toString(),
      startTime: newStartTime,
      endTime: newEndTime
    }

    setTimeSlots([...timeSlots, newSlot])
    setNewStartTime("09:00")
    setNewEndTime("17:00")

    toast({
      title: "Time slot added",
      description: `Added time slot: ${newStartTime} - ${newEndTime}`,
    })
  }

  const handleRemoveTimeSlot = (id: string) => {
    setTimeSlots(timeSlots.filter(slot => slot.id !== id))
    
    toast({
      title: "Time slot removed",
      description: "The time slot has been removed.",
    })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Mock form submission
    console.log({
      name,
      description,
      spaceType,
      timeSlots
    })

    toast({
      title: "Space saved",
      description: "The space information has been saved successfully.",
    })
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>Edit Space</CardTitle>
          <CardDescription>Manage space details and availability</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input 
                id="name" 
                placeholder="e.g. Truck Space #1" 
                value={name} 
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Input 
                id="description" 
                placeholder="Description of the space" 
                value={description} 
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="type">Space Type</Label>
              <select 
                id="type" 
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={spaceType}
                onChange={(e) => setSpaceType(e.target.value)}
              >
                <option value="regular">Regular Food Truck</option>
                <option value="premium">Premium Location</option>
                <option value="event">Event Space</option>
              </select>
            </div>
          </div>
          
          <Separator />
          
          <div>
            <h3 className="text-lg font-medium mb-4">Time Slots</h3>
            <div className="grid gap-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="startTime">Start Time</Label>
                  <Input 
                    id="startTime" 
                    type="time" 
                    value={newStartTime} 
                    onChange={(e) => setNewStartTime(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="endTime">End Time</Label>
                  <Input 
                    id="endTime" 
                    type="time" 
                    value={newEndTime} 
                    onChange={(e) => setNewEndTime(e.target.value)}
                  />
                </div>
                <div className="flex items-end">
                  <Button 
                    type="button" 
                    onClick={handleAddTimeSlot}
                    className="w-full"
                  >
                    Add Time Slot
                  </Button>
                </div>
              </div>
              
              {timeSlots.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                  No time slots have been added yet.
                </div>
              ) : (
                <div className="border rounded-md">
                  {timeSlots.map((slot) => (
                    <div 
                      key={slot.id} 
                      className="flex justify-between items-center p-3 border-b last:border-b-0"
                    >
                      <div>
                        {slot.startTime} - {slot.endTime}
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleRemoveTimeSlot(slot.id)}
                        className="text-red-500 hover:bg-red-100 hover:text-red-600"
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" type="button">
            Cancel
          </Button>
          <Button type="submit">
            Save Changes
          </Button>
        </CardFooter>
      </Card>
    </form>
  )
}