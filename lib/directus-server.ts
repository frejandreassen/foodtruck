/**
 * Directus server functions for server-side API communication
 */
import { serverEnv } from "@/lib/env";

interface DirectusErrorResponse {
  errors?: { message?: string }[];
}

const DIRECTUS_URL = serverEnv.DIRECTUS_URL;

/**
 * Create a Directus request with proper error handling
 */
async function directusRequest<T>(
  endpoint: string,
  options: RequestInit
): Promise<T> {
  const url = `${DIRECTUS_URL}${endpoint}`;
  
  try {
    console.log(`Making Directus request to: ${url}`);
    const response = await fetch(url, options);
    
    if (!response.ok) {
      try {
        const errorData = await response.json() as DirectusErrorResponse;
        
        // Get the actual error message or create a user-friendly one
        let errorMessage = errorData.errors?.[0]?.message;
        
        // If no specific error message, create a user-friendly one based on status code
        if (!errorMessage) {
          if (response.status === 401) {
            errorMessage = "Invalid email or password";
          } else if (response.status === 403) {
            errorMessage = "You don't have permission to access this resource";
          } else if (response.status === 404) {
            errorMessage = "The requested resource was not found";
          } else if (response.status === 429) {
            errorMessage = "Too many requests, please try again later";
          } else if (response.status >= 500) {
            errorMessage = "Server error, please try again later";
          } else {
            errorMessage = `Request failed (${response.status})`;
          }
        }
        
        throw new Error(errorMessage);
      } catch (jsonError) {
        // If we can't parse the error as JSON, create a user-friendly message
        let errorMessage = "An error occurred";
        
        if (response.status === 401) {
          errorMessage = "Invalid email or password";
        } else if (response.status === 403) {
          errorMessage = "You don't have permission to access this resource";
        } else if (response.status === 404) {
          errorMessage = "The requested resource was not found";
        } else if (response.status === 429) {
          errorMessage = "Too many requests, please try again later";
        } else if (response.status >= 500) {
          errorMessage = "Server error, please try again later";
        }
        
        throw new Error(errorMessage);
      }
    }
    
    // Handle empty responses (like 204 No Content)
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const text = await response.text();
      return text ? JSON.parse(text) as T : {} as T;
    }
    
    return {} as T;
  } catch (error) {
    console.error(`Directus API error (${endpoint}):`, error);
    throw error;
  }
}

/**
 * Server functions for Directus API
 */
export const directusServer = {
  /**
   * Authenticate user with email and password
   */
  async login(email: string, password: string) {
    return directusRequest<{ data: { access_token: string; refresh_token: string } }>(
      "/auth/login",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      }
    );
  },
  
  /**
   * Request password reset
   */
  async requestPasswordReset(email: string, resetUrl: string) {
    console.log(`Sending password reset request for ${email} with reset URL: ${resetUrl}`);
    
    // This endpoint may return a 204 No Content with no response body
    return directusRequest<{ data?: object }>(
      "/auth/password/request",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, reset_url: resetUrl }),
      }
    );
  },
  
  /**
   * Reset password with token
   */
  async resetPassword(token: string, password: string) {
    return directusRequest<{ data: object }>(
      "/auth/password/reset",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      }
    );
  },
  
  /**
   * Get current user data
   */
  async getCurrentUser(token: string) {
    return directusRequest<{ data: any }>(
      "/users/me",
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );
  },
  
  /**
   * Refresh access token
   */
  async refreshToken(refreshToken: string) {
    return directusRequest<{ data: { access_token: string; refresh_token: string } }>(
      "/auth/refresh",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token: refreshToken }),
      }
    );
  },
  
  /**
   * Get all food trucks
   */
  async getFoodTrucks(token: string) {
    return directusRequest<{ data: any[] }>(
      "/items/foodtrucks",
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );
  },
  
  /**
   * Get food truck by ID
   */
  async getFoodTruck(id: string, token: string) {
    return directusRequest<{ data: any }>(
      `/items/foodtrucks/${id}`,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );
  },
  
  /**
   * Get food truck by user ID
   */
  async getFoodTruckByUser(token: string) {
    return directusRequest<{ data: any[] }>(
      `/items/foodtrucks?filter[user][_eq]=$CURRENT_USER`,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );
  },
  
  /**
   * Update food truck information
   */
  async updateFoodTruck(id: string, data: any, token: string) {
    return directusRequest<{ data: any }>(
      `/items/foodtrucks/${id}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      }
    );
  },
  
  /**
   * Upload file to Directus
   */
  async uploadFile(formData: FormData, token: string) {
    // Special case for file uploads - we need to use FormData
    const url = `${DIRECTUS_URL}/files`;
    
    try {
      console.log(`Uploading file to: ${url}`);
      const response = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          // Note: Don't set Content-Type header for FormData
        },
        body: formData,
      });
      
      if (!response.ok) {
        try {
          const errorData = await response.json() as DirectusErrorResponse;
          throw new Error(
            errorData.errors?.[0]?.message || 
            `Directus request failed with status ${response.status}`
          );
        } catch (jsonError) {
          throw new Error(`File upload failed with status ${response.status}`);
        }
      }
      
      return response.json();
    } catch (error) {
      console.error(`File upload error:`, error);
      throw error;
    }
  },
  
  /**
   * Get all spaces
   */
  async getSpaces(token: string) {
    return directusRequest<{ data: any[] }>(
      "/items/spaces",
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );
  },
  
  /**
   * Get all spaces with their bookings for a date range
   */
  async getSpacesWithBookings(startDate: string, endDate: string, token: string) {
    const encodedStartDate = encodeURIComponent(startDate);
    const encodedEndDate = encodeURIComponent(endDate);
    
    return directusRequest<{ data: any[] }>(
      `/items/spaces?fields=*,bookings.*,bookings.foodtruck.*&filter[bookings][start][_between]=[${encodedStartDate},${encodedEndDate}]`,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );
  },
  
  /**
   * Get space by ID
   */
  async getSpace(id: string, token: string) {
    return directusRequest<{ data: any }>(
      `/items/spaces/${id}`,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );
  },
  
  /**
   * Get all bookings
   */
  async getBookings(token: string) {
    return directusRequest<{ data: any[] }>(
      "/items/foodtruck_bookings",
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );
  },
  
  /**
   * Get all bookings for a date range
   */
  async getBookingsForDateRange(startDate: string, endDate: string, token: string) {
    const encodedStartDate = encodeURIComponent(startDate);
    const encodedEndDate = encodeURIComponent(endDate);
    
    return directusRequest<{ data: any[] }>(
      `/items/foodtruck_bookings?filter[start][_between]=[${encodedStartDate},${encodedEndDate}]&fields=*,space.*,foodtruck.*`,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );
  },
  
  /**
   * Get bookings for a specific food truck
   */
  async getFoodTruckBookings(foodTruckId: string, token: string) {
    return directusRequest<{ data: any[] }>(
      `/items/foodtruck_bookings?filter[foodtruck][_eq]=${foodTruckId}&sort=start`,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );
  },
  
  /**
   * Get booking rules
   */
  async getBookingRules(token: string) {
    return directusRequest<{ data: any }>(
      "/items/foodtruck_rules",
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );
  },
  
  /**
   * Create a new booking
   */
  async createBooking(bookingData: {
    foodtruck: string | number;
    space: string | number;
    start: string;
    end: string;
  }, token: string) {
    return directusRequest<{ data: any }>(
      "/items/foodtruck_bookings",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(bookingData),
      }
    );
  },
  
  /**
   * Update a booking
   */
  async updateBooking(
    id: string,
    bookingData: Partial<{
      foodtruck: string | number;
      space: string | number;
      start: string;
      end: string;
    }>,
    token: string
  ) {
    return directusRequest<{ data: any }>(
      `/items/foodtruck_bookings/${id}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(bookingData),
      }
    );
  },
  
  /**
   * Delete a booking
   */
  async deleteBooking(id: string, token: string) {
    return directusRequest<void>(
      `/items/foodtruck_bookings/${id}`,
      {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );
  },
};