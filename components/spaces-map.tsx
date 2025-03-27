'use client'

import React, { useCallback, useEffect, useState } from 'react';
import { GoogleMap } from '@react-google-maps/api';
import { Soup, MapPin } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useMapsApi } from '@/lib/maps-context';

// Add global type definition for window to track InfoWindow
declare global {
  interface Window {
    currentInfoWindow?: google.maps.InfoWindow;
  }
}

interface Space {
  id: string | number;
  name: string;
  location: {
    type?: string;
    coordinates?: [number, number]; // [longitude, latitude]
  };
  description?: string | null;
  time_slots?: Array<{
    description: string;
    start: string;
    end: string;
  }>;
  bookings?: Array<number>;
}

interface SpacesMapProps {
  spaces: Space[];
  center?: {
    lat: number;
    lng: number;
  };
  zoom?: number;
  height?: string;
  width?: string;
  onSpaceSelect?: (space: Space) => void;
}

// No need to define libraries anymore

const SpacesMap: React.FC<SpacesMapProps> = ({
  spaces,
  center = { lat: 56.9055, lng: 12.4912 }, // Default to Falkenberg, Sweden
  zoom = 17,
  height = "600px",
  width = "100%",
  onSpaceSelect
}) => {
  const markersRef = React.useRef<google.maps.Marker[]>([]);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [infoWindows, setInfoWindows] = useState<any[]>([]);
  const [selectedSpace, setSelectedSpace] = useState<Space | null>(null);
  
  // Use the shared maps context instead of loading script here
  const { isLoaded } = useMapsApi();

  const mapContainerStyle: React.CSSProperties = {
    height,
    width,
    borderRadius: '0.5rem',
  };

  const options = {
    disableDefaultUI: false,
    zoomControl: true,
    mapTypeControl: true,
    scaleControl: true,
    streetViewControl: true,
    rotateControl: false,
    fullscreenControl: true,
    mapId: process.env.NEXT_PUBLIC_GOOGLE_MAP_ID || 'DEMO_MAP_ID'
  };

  // Create and add markers for each space - using simpler classic markers to prevent crashes
  const createMarkers = useCallback((map: google.maps.Map) => {
    if (!map) return;
    
    // Clear existing markers first
    markersRef.current.forEach(marker => {
      if (marker) marker.setMap(null);
    });
    
    // Empty the markers array
    markersRef.current = [];
    
    try {
      spaces
        .filter(space => space.location && space.location.coordinates && space.location.coordinates.length === 2)
        .forEach(space => {
          const coords = space.location.coordinates!;
          // Note: GeoJSON uses [longitude, latitude] format while Google Maps uses [latitude, longitude]
          const position = { lat: coords[1], lng: coords[0] };
          
          // Create a simple marker
          const marker = new google.maps.Marker({
            map,
            position,
            title: space.name,
            icon: {
              path: google.maps.SymbolPath.CIRCLE,
              fillColor: '#FF5722',
              fillOpacity: 1,
              strokeColor: '#B71C1C',
              strokeWeight: 2,
              scale: 8,
            },
            animation: google.maps.Animation.DROP,
            // Make clickable area larger
            clickable: true
          });
          
          // Create info window for each marker
          const infoWindow = new google.maps.InfoWindow({
            content: `
              <div style="padding: 8px; max-width: 200px;">
                <strong>${space.name}</strong>
                <p style="margin: 4px 0; font-size: 12px;">
                  ${space.description || 'No description available'}
                </p>
                <button 
                  id="view-space-${space.id}" 
                  style="background: #0284c7; color: white; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer; margin-top: 4px; font-size: 12px;"
                >
                  View Details
                </button>
              </div>
            `
          });
          
          // Add click event to marker
          marker.addListener('click', () => {
            // Close any open info windows
            if ((window as any).currentInfoWindow) {
              (window as any).currentInfoWindow.close();
            }
            
            // Open this info window
            infoWindow.open(map, marker);
            // Store as global to track open windows
            (window as any).currentInfoWindow = infoWindow;
            
            // Set this space as selected
            setSelectedSpace(space);
            
            // Add event listener to the view details button after info window is displayed
            google.maps.event.addListenerOnce(infoWindow, 'domready', () => {
              const button = document.getElementById(`view-space-${space.id}`);
              if (button) {
                button.addEventListener('click', () => {
                  if (onSpaceSelect) {
                    onSpaceSelect(space);
                  }
                });
              }
            });
          });
          
          // Add the marker to our ref
          markersRef.current.push(marker);
        });
    } catch (error) {
      console.error('Error creating markers:', error);
    }
  }, [spaces, onSpaceSelect]); // Remove markers from dependencies

  // Handle map load - simplified and fixed
  const onMapLoad = useCallback((map: google.maps.Map) => {
    setMap(map);
    
    // If there are spaces with coordinates, auto-center the map
    if (spaces.length > 0) {
      const spacesWithCoords = spaces.filter(
        space => space.location && space.location.coordinates && space.location.coordinates.length === 2
      );
      
      if (spacesWithCoords.length > 0) {
        // Use the first space's coordinates as center
        const firstSpace = spacesWithCoords[0];
        const coords = firstSpace.location.coordinates!;
        map.setCenter({ lat: coords[1], lng: coords[0] });
      }
    }
    
    // Don't create markers here - will be handled by the effect
  }, [spaces]); // Don't include createMarkers here

  // Create markers when map or spaces change
  useEffect(() => {
    // Only run if map is available and spaces have changed
    if (map) {
      const timer = setTimeout(() => {
        createMarkers(map);
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [spaces, map, createMarkers]);

  // Cleanup markers on unmount
  useEffect(() => {
    return () => {
      markersRef.current.forEach(marker => {
        if (marker) marker.setMap(null);
      });
      markersRef.current = [];
    };
  }, []);

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center" style={{ height, width }}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="relative">
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        zoom={zoom}
        center={center}
        options={options}
        onLoad={onMapLoad}
      />
      
      {selectedSpace && (
        <Card className="absolute bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 shadow-lg z-10 bg-white">
          <CardContent className="p-4">
            <div className="flex items-start gap-2">
              <div className="bg-primary rounded-full p-1.5 text-white">
                <MapPin size={16} />
              </div>
              <div className="flex-1">
                <h3 className="font-medium">{selectedSpace.name}</h3>
                <p className="text-sm text-muted-foreground">{selectedSpace.description || 'No description available'}</p>
                
                {selectedSpace.time_slots && selectedSpace.time_slots.length > 0 && (
                  <div className="mt-2">
                    <p className="text-xs font-medium text-muted-foreground mb-1">Available time slots:</p>
                    <div className="space-y-1">
                      {selectedSpace.time_slots.map((slot, index) => (
                        <div key={index} className="text-xs bg-muted px-2 py-1 rounded">
                          {slot.description}: {slot.start.substring(0, 5)} - {slot.end.substring(0, 5)}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                <button 
                  className="mt-3 text-xs text-primary hover:underline"
                  onClick={() => setSelectedSpace(null)}
                >
                  Close
                </button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SpacesMap;