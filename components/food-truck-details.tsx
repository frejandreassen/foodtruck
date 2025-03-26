"use client"

import { useState, useRef } from "react"
import Image from "next/image"
import { updateFoodTruck, uploadFoodTruckImage } from "@/app/actions"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { serverEnv } from "@/lib/env"

interface FoodTruckDetailsProps {
  foodTruck: {
    id: string
    name: string
    description?: string
    image?: string
  } | null
  onUpdate?: () => void
}

export function FoodTruckDetails({ foodTruck, onUpdate }: FoodTruckDetailsProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [name, setName] = useState(foodTruck?.name || "")
  const [description, setDescription] = useState(foodTruck?.description || "")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  // Construct image URL, ensuring it's properly formatted
  const constructImageUrl = (imageId: string | undefined) => {
    if (!imageId) return null;
    
    const baseUrl = serverEnv.DIRECTUS_URL || 'https://cms.businessfalkenberg.se';
    // Remove trailing slash if present
    const cleanBaseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
    return `${cleanBaseUrl}/assets/${imageId}`;
  }
  
  const [imagePreview, setImagePreview] = useState<string | null>(
    constructImageUrl(foodTruck?.image)
  )
  
  const fileInputRef = useRef<HTMLInputElement>(null)

  if (!foodTruck) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Your Food Truck</CardTitle>
          <CardDescription>You don't have a food truck yet.</CardDescription>
        </CardHeader>
        <CardFooter>
          <Button>Add Your Food Truck</Button>
        </CardFooter>
      </Card>
    )
  }

  const handleEdit = () => {
    setName(foodTruck.name)
    setDescription(foodTruck.description || "")
    setImagePreview(constructImageUrl(foodTruck.image))
    setIsEditing(true)
  }

  const handleCancel = () => {
    setIsEditing(false)
    setError("")
    setImagePreview(constructImageUrl(foodTruck.image))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError("")

    try {
      const result = await updateFoodTruck(foodTruck.id, {
        name,
        description,
      })

      if (result.success) {
        setIsEditing(false)
        if (onUpdate) onUpdate()
      } else {
        setError(result.error || "Failed to update food truck")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    setError("")
    setUploadProgress(0)

    try {
      // Create a FormData object to send the file
      const formData = new FormData()
      formData.append("file", file)
      
      // Upload the image
      const uploadResult = await uploadFoodTruckImage(formData)
      
      if (uploadResult.success && uploadResult.data) {
        // Update the food truck with the new image ID
        const updateResult = await updateFoodTruck(foodTruck.id, {
          image: uploadResult.data.id
        })
        
        if (updateResult.success) {
          // Update the preview
          setImagePreview(constructImageUrl(uploadResult.data.id))
          
          // Refresh the data
          if (onUpdate) onUpdate()
        } else {
          setError(updateResult.error || "Failed to update food truck with new image")
        }
      } else {
        setError(uploadResult.error || "Failed to upload image")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setIsUploading(false)
      setUploadProgress(0)
      
      // Clear the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  const handleImageClick = () => {
    if (isEditing && fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Food Truck</CardTitle>
        <CardDescription>Manage your food truck details</CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
            {error}
          </div>
        )}
        
        <div className="flex flex-col md:flex-row gap-6">
          {/* Image */}
          <div className="flex-shrink-0">
            <div 
              className={`relative w-48 h-48 border rounded-md overflow-hidden flex items-center justify-center bg-gray-100 
                ${isEditing ? 'cursor-pointer hover:opacity-80' : ''}`}
              onClick={handleImageClick}
            >
              {imagePreview ? (
                <Image 
                  src={imagePreview}
                  alt={foodTruck.name}
                  fill
                  style={{ objectFit: 'cover' }}
                  sizes="(max-width: 768px) 100vw, 384px"
                  priority
                />
              ) : (
                <div className="text-center text-gray-500 p-4">
                  {isEditing ? "Click to upload image" : "No image"}
                </div>
              )}
              
              {isUploading && (
                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                  <div className="text-white">Uploading... {uploadProgress}%</div>
                </div>
              )}
              
              <input 
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleImageUpload}
                disabled={isUploading || isSubmitting}
              />
            </div>
            {isEditing && (
              <div className="mt-2 text-sm text-center text-gray-500">
                Click the image to upload a new one
              </div>
            )}
          </div>
          
          {/* Form fields */}
          <div className="flex-grow">
            {isEditing ? (
              <form onSubmit={handleSubmit}>
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="description">Description</Label>
                    <Input
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                    />
                  </div>
                </div>
              </form>
            ) : (
              <div className="space-y-2">
                <div>
                  <h3 className="font-medium">Name</h3>
                  <p>{foodTruck.name}</p>
                </div>
                {foodTruck.description && (
                  <div>
                    <h3 className="font-medium">Description</h3>
                    <p>{foodTruck.description}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
      <CardFooter>
        {isEditing ? (
          <div className="flex gap-2">
            <Button type="button" onClick={handleSubmit} disabled={isSubmitting || isUploading}>
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isSubmitting || isUploading}
            >
              Cancel
            </Button>
          </div>
        ) : (
          <Button type="button" onClick={handleEdit}>
            Edit Details
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}