'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useLoadScript } from '@react-google-maps/api';

interface MapsContextType {
  isLoaded: boolean;
  loadError: Error | undefined;
}

const MapsContext = createContext<MapsContextType | undefined>(undefined);

export function MapsProvider({ children }: { children: ReactNode }) {
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    // Remove any libraries that cause issues
  });

  return (
    <MapsContext.Provider value={{ isLoaded, loadError }}>
      {children}
    </MapsContext.Provider>
  );
}

export function useMapsApi() {
  const context = useContext(MapsContext);
  
  if (context === undefined) {
    throw new Error('useMapsApi must be used within a MapsProvider');
  }
  
  return context;
}