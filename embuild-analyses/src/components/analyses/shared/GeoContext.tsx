"use client"

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { RegionCode, ProvinceCode, MunicipalityCode } from '@/lib/geo-utils';

export type GeoLevel = 'region' | 'province' | 'municipality';

interface GeoContextType {
  level: GeoLevel;
  setLevel: (level: GeoLevel) => void;
  selectedRegion: RegionCode;
  setSelectedRegion: (code: RegionCode) => void;
  selectedProvince: ProvinceCode | null;
  setSelectedProvince: (code: ProvinceCode | null) => void;
  selectedMunicipality: MunicipalityCode | null;
  setSelectedMunicipality: (code: MunicipalityCode | null) => void;
}

const GeoContext = createContext<GeoContextType | undefined>(undefined);

export function GeoProvider({ children }: { children: ReactNode }) {
  const [level, setLevel] = useState<GeoLevel>('region');
  const [selectedRegion, setSelectedRegion] = useState<RegionCode>('1000'); // Default to Belgium
  const [selectedProvince, setSelectedProvince] = useState<ProvinceCode | null>(null);
  const [selectedMunicipality, setSelectedMunicipality] = useState<MunicipalityCode | null>(null);

  return (
    <GeoContext.Provider
      value={{
        level,
        setLevel,
        selectedRegion,
        setSelectedRegion,
        selectedProvince,
        setSelectedProvince,
        selectedMunicipality,
        setSelectedMunicipality,
      }}
    >
      {children}
    </GeoContext.Provider>
  );
}

export function useGeo() {
  const context = useContext(GeoContext);
  if (context === undefined) {
    throw new Error('useGeo must be used within a GeoProvider');
  }
  return context;
}
