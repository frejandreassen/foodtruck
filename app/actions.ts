'use server'

import { cookies } from 'next/headers'
import { revalidatePath, revalidateTag } from 'next/cache'
import { directusServer } from '@/lib/directus-server'
import { serverEnv } from '@/lib/env'

/**
 * Login with email and password
 */
export async function login(email: string, password: string) {
  try {
    const response = await directusServer.login(email, password)
    
    // Set access token in a cookie
    const cookieStore = await cookies()
    cookieStore.set('access_token', response.data.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 60 * 60, // 1 hour
    })
    
    cookieStore.set('refresh_token', response.data.refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 60 * 60, // 1 hour
    })
    
    return { success: true, data: response.data }
  } catch (error) {
    console.error('Login error:', error)
    
    // Provide a more user-friendly error message
    let errorMessage = 'Failed to login';
    
    if (error instanceof Error) {
      errorMessage = error.message;
      
      // Make login errors even more user-friendly
      if (errorMessage.includes('401') || errorMessage.includes('Invalid credentials')) {
        errorMessage = 'Invalid email or password';
      } else if (errorMessage.includes('network') || errorMessage.includes('connection')) {
        errorMessage = 'Unable to connect to the server. Please check your internet connection.';
      }
    }
    
    return { success: false, error: errorMessage }
  }
}

/**
 * Request password reset
 */
export async function requestPasswordReset(email: string) {
  try {
    const resetUrl = `${serverEnv.APP_URL}/auth/password-reset`
    console.log(`Requesting password reset with resetUrl: ${resetUrl}`);
    
    const response = await directusServer.requestPasswordReset(email, resetUrl)
    
    // Password reset requests may return a 204 No Content, which is a success with no data
    return { success: true, data: response.data || {} }
  } catch (error) {
    console.error('Password request error:', error)
    
    // Provide a more user-friendly error message
    let errorMessage = 'Failed to request password reset';
    
    if (error instanceof Error) {
      errorMessage = error.message;
      
      // Make password request errors more user-friendly
      if (errorMessage.includes('not found') || errorMessage.includes('no matching user')) {
        errorMessage = 'If your email is registered, you will receive a password reset link.';
        // Note: For security, we don't want to reveal whether an email exists in the system
        // So we return "success" even when there's an error for email not found
        return { success: true, data: {} };
      } else if (errorMessage.includes('network') || errorMessage.includes('connection')) {
        errorMessage = 'Unable to connect to the server. Please check your internet connection.';
      }
    }
    
    return { success: false, error: errorMessage }
  }
}

/**
 * Reset password with token
 */
export async function resetPassword(token: string, password: string) {
  try {
    const response = await directusServer.resetPassword(token, password)
    
    return { success: true, data: response.data }
  } catch (error) {
    console.error('Password reset error:', error)
    
    // Provide a more user-friendly error message
    let errorMessage = 'Failed to reset password';
    
    if (error instanceof Error) {
      errorMessage = error.message;
      
      // Make password reset errors more user-friendly
      if (errorMessage.includes('expired') || errorMessage.includes('invalid token')) {
        errorMessage = 'Your password reset link has expired or is invalid. Please request a new one.';
      } else if (errorMessage.includes('network') || errorMessage.includes('connection')) {
        errorMessage = 'Unable to connect to the server. Please check your internet connection.';
      }
    }
    
    return { success: false, error: errorMessage }
  }
}

/**
 * Get current user data
 */
export async function getCurrentUser() {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('access_token')?.value
    
    if (!token) {
      return { success: false, error: 'Not authenticated' }
    }
    
    const response = await directusServer.getCurrentUser(token)
    
    return { success: true, data: response.data }
  } catch (error) {
    console.error('Get user error:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to get user data' 
    }
  }
}

/**
 * Get user's food truck
 */
export async function getUserFoodTruck() {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('access_token')?.value
    
    if (!token) {
      return { success: false, error: 'Not authenticated' }
    }
    
    const response = await directusServer.getFoodTruckByUser(token)
    
    // Return the first food truck (users should only have one food truck)
    return { 
      success: true, 
      data: response.data && response.data.length > 0 ? response.data[0] : null
    }
  } catch (error) {
    console.error('Get food truck error:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to get food truck data' 
    }
  }
}

/**
 * Update food truck information
 */
export async function updateFoodTruck(id: string, data: any) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('access_token')?.value
    
    if (!token) {
      return { success: false, error: 'Not authenticated' }
    }
    
    const response = await directusServer.updateFoodTruck(id, data, token)
    
    return { success: true, data: response.data }
  } catch (error) {
    console.error('Update food truck error:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to update food truck' 
    }
  }
}

/**
 * Upload image for food truck
 */
export async function uploadFoodTruckImage(formData: FormData) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('access_token')?.value
    
    if (!token) {
      return { success: false, error: 'Not authenticated' }
    }
    
    // 1. Upload the file to Directus
    const fileResponse = await directusServer.uploadFile(formData, token)
    
    if (!fileResponse || !fileResponse.data || !fileResponse.data.id) {
      throw new Error('File upload failed')
    }
    
    // Return the file ID and information
    return { 
      success: true, 
      data: fileResponse.data 
    }
  } catch (error) {
    console.error('Image upload error:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to upload image' 
    }
  }
}

/**
 * Get food truck bookings
 */
export async function getFoodTruckBookings(foodTruckId: string) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('access_token')?.value
    
    if (!token) {
      return { success: false, error: 'Not authenticated' }
    }
    
    const response = await directusServer.getFoodTruckBookings(foodTruckId, token)
    
    // Tag the request so it can be revalidated later
    revalidateTag(`bookings-${foodTruckId}`)
    revalidateTag('bookings')
    
    return { success: true, data: response.data }
  } catch (error) {
    console.error('Get bookings error:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to get bookings' 
    }
  }
}

/**
 * Get booking rules
 */
export async function getBookingRules() {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('access_token')?.value
    
    if (!token) {
      return { success: false, error: 'Not authenticated' }
    }
    
    const response = await directusServer.getBookingRules(token)
    
    return { success: true, data: response.data }
  } catch (error) {
    console.error('Get booking rules error:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to get booking rules' 
    }
  }
}

/**
 * Get all spaces
 */
export async function getAllSpaces() {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('access_token')?.value
    
    if (!token) {
      return { success: false, error: 'Not authenticated' }
    }
    
    const response = await directusServer.getSpaces(token)
    
    return { success: true, data: response.data }
  } catch (error) {
    console.error('Get spaces error:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to get spaces' 
    }
  }
}

/**
 * Get spaces with bookings for a date range
 */
export async function getSpacesWithBookings(startDate: string, endDate: string) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('access_token')?.value
    
    if (!token) {
      return { success: false, error: 'Not authenticated' }
    }
    
    const response = await directusServer.getSpacesWithBookings(startDate, endDate, token)
    
    return { success: true, data: response.data }
  } catch (error) {
    console.error('Get spaces with bookings error:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to get spaces with bookings' 
    }
  }
}

/**
 * Get all bookings for a date range
 */
export async function getBookingsForDateRange(startDate: string, endDate: string) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('access_token')?.value
    
    if (!token) {
      return { success: false, error: 'Not authenticated' }
    }
    
    const response = await directusServer.getBookingsForDateRange(startDate, endDate, token)
    
    // Tag the request for date-specific revalidation
    const startDateFormat = new Date(startDate).toISOString().split('T')[0]
    const endDateFormat = new Date(endDate).toISOString().split('T')[0]
    revalidateTag(`bookings-range-${startDateFormat}-${endDateFormat}`)
    revalidateTag('bookings')
    
    return { success: true, data: response.data }
  } catch (error) {
    console.error('Get bookings error:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to get bookings' 
    }
  }
}

/**
 * Create a new booking
 */
export async function createBooking(bookingData: {
  foodtruck: string;
  space: string;
  start: string;
  end: string;
}) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('access_token')?.value
    
    if (!token) {
      return { success: false, error: 'Not authenticated' }
    }
    
    // First check if the user has reached their maximum bookings
    const rulesResult = await getBookingRules()
    if (!rulesResult.success) {
      return { success: false, error: 'Failed to check booking rules' }
    }
    
    const rules = rulesResult.data
    
    // Get the user's food truck
    const foodTruckResult = await getUserFoodTruck()
    if (!foodTruckResult.success || !foodTruckResult.data) {
      return { success: false, error: 'Failed to get food truck information' }
    }
    
    const foodTruck = foodTruckResult.data
    
    // Get current bookings for this food truck
    const now = new Date()
    const bookingsResult = await getFoodTruckBookings(foodTruck.id)
    
    if (!bookingsResult.success) {
      return { success: false, error: 'Failed to check current bookings' }
    }
    
    // Filter to future bookings only
    const futureBookings = (bookingsResult.data || []).filter((booking: any) => {
      return new Date(booking.start) > now
    })
    
    if (futureBookings.length >= rules.maximum_future_bookings) {
      return { 
        success: false, 
        error: `You already have ${rules.maximum_future_bookings} future bookings, which is the maximum allowed` 
      }
    }
    
    // Check that booking is not too far in the future
    const bookingStartDate = new Date(bookingData.start)
    const maxAllowedDate = new Date()
    maxAllowedDate.setDate(maxAllowedDate.getDate() + rules.maximum_days_ahead)
    
    if (bookingStartDate > maxAllowedDate) {
      return { 
        success: false, 
        error: `Bookings can only be made up to ${rules.maximum_days_ahead} days in advance` 
      }
    }
    
    // Create the booking
    const response = await directusServer.createBooking(bookingData, token)
    
    // Revalidate booking data
    revalidateTag('bookings')
    revalidatePath('/booking')
    revalidatePath('/')
    
    return { success: true, data: response.data }
  } catch (error) {
    console.error('Create booking error:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to create booking' 
    }
  }
}

/**
 * Refresh access token
 */
export async function refreshToken() {
  try {
    const cookieStore = await cookies()
    const refreshToken = cookieStore.get('refresh_token')?.value
    
    if (!refreshToken) {
      return { success: false, error: 'No refresh token' }
    }
    
    const response = await directusServer.refreshToken(refreshToken)
    
    // Update access token in a cookie
    cookieStore.set('access_token', response.data.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 60 * 60, // 1 hour
    })
    
    cookieStore.set('refresh_token', response.data.refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 60 * 60, // 1 hour
    })
    
    return { success: true, data: response.data }
  } catch (error) {
    console.error('Token refresh error:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to refresh token' 
    }
  }
}

/**
 * Logout user
 */
export async function logout() {
  const cookieStore = await cookies()
  
  // Clear cookies
  cookieStore.delete('access_token')
  cookieStore.delete('refresh_token')
  
  return { success: true }
}

/**
 * Cancel a booking
 */
export async function cancelBooking(bookingId: string) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('access_token')?.value
    
    if (!token) {
      return { success: false, error: 'Not authenticated' }
    }
    
    // First verify that the booking belongs to the current user
    const userResult = await getUserFoodTruck()
    if (!userResult.success || !userResult.data) {
      return { success: false, error: 'Unable to verify ownership of this booking' }
    }
    
    const userFoodTruck = userResult.data
    
    // Delete the booking
    await directusServer.deleteBooking(bookingId, token)
    
    // Revalidate booking data
    revalidateTag('bookings')
    revalidatePath('/booking')
    revalidatePath('/')
    
    return { success: true }
  } catch (error) {
    console.error('Cancel booking error:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to cancel booking' 
    }
  }
}