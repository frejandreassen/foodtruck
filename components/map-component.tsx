'use client'

import React, { useCallback, useEffect, useState } from 'react';
import { GoogleMap } from '@react-google-maps/api';
import { useMapsApi } from '@/lib/maps-context';

interface MapComponentProps {
  center: {
    lat: number;
    lng: number;
  };
  zoom?: number;
  height?: string;
  width?: string;
}

// No need to define libraries anymore

const MapComponent: React.FC<MapComponentProps> = ({
  center,
  zoom = 15,
  height = "400px",
  width = "100%"
}) => {
  const [advancedMarker, setAdvancedMarker] = useState<any>(null);
  
  // Use the shared maps context instead of loading script here
  const { isLoaded } = useMapsApi();

  const mapContainerStyle: React.CSSProperties = {
    height,
    width
  };

  // Remove styles when using mapId
  const options = {
    disableDefaultUI: true,
    zoomControl: true,
    mapTypeControl: false,
    scaleControl: false,
    streetViewControl: false,
    rotateControl: false,
    fullscreenControl: false,
    mapId: process.env.NEXT_PUBLIC_GOOGLE_MAP_ID || 'DEMO_MAP_ID'
  };

  const onMapLoad = useCallback(async (map: google.maps.Map) => {
    try {
      const { AdvancedMarkerElement } = await google.maps.importLibrary("marker") as google.maps.MarkerLibrary;
      
      const marker = new AdvancedMarkerElement({
        map,
        position: center,
        title: 'Location'
      });
      
      setAdvancedMarker(marker);
    } catch (error) {
      console.error('Error loading advanced marker:', error);
    }
  }, [center]);

  // Cleanup marker on unmount
  useEffect(() => {
    return () => {
      if (advancedMarker) {
        advancedMarker.map = null;
      }
    };
  }, [advancedMarker]);

  if (!isLoaded) return <div>Loading...</div>;

  return (
    <GoogleMap
      mapContainerStyle={mapContainerStyle}
      zoom={zoom}
      center={center}
      options={options}
      onLoad={onMapLoad}
    />
  );
};

export default MapComponent;