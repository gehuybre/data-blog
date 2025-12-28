export type RegionCode = '2000' | '3000' | '4000' | '1000'; // 1000 for Belgium
export type ProvinceCode = string;
export type MunicipalityCode = string;

export interface Region {
  code: RegionCode;
  name: string;
}

export interface Province {
  code: ProvinceCode;
  name: string;
  regionCode: RegionCode;
}

export interface Municipality {
  code: number;
  name: string;
}

export const REGIONS: Region[] = [
  { code: '1000', name: 'België' },
  { code: '2000', name: 'Vlaanderen' },
  { code: '3000', name: 'Wallonië' },
  { code: '4000', name: 'Brussel' },
];

export const PROVINCES: Province[] = [
  { code: '10000', name: 'Antwerpen', regionCode: '2000' },
  { code: '70000', name: 'Limburg', regionCode: '2000' },
  { code: '40000', name: 'Oost-Vlaanderen', regionCode: '2000' },
  { code: '20001', name: 'Vlaams-Brabant', regionCode: '2000' },
  { code: '30000', name: 'West-Vlaanderen', regionCode: '2000' },
  { code: '20002', name: 'Waals-Brabant', regionCode: '3000' },
  { code: '50000', name: 'Henegouwen', regionCode: '3000' },
  { code: '60000', name: 'Luik', regionCode: '3000' },
  { code: '80000', name: 'Luxemburg', regionCode: '3000' },
  { code: '90000', name: 'Namen', regionCode: '3000' },
  { code: '21000', name: 'Brussel', regionCode: '4000' },
];

export function getRegionForProvince(provinceCode: ProvinceCode): RegionCode | undefined {
  return PROVINCES.find(p => p.code === provinceCode)?.regionCode;
}

export function getProvinceForMunicipality(municipalityCode: number): ProvinceCode {
  const code = municipalityCode.toString();
  if (code.startsWith('21')) return '21000'; // Brussels

  const prefix = code.substring(0, 1);
  const prefix2 = code.substring(0, 2);

  if (prefix === '1') return '10000'; // Antwerpen
  if (prefix === '7') return '70000'; // Limburg
  if (prefix === '4') return '40000'; // Oost-Vlaanderen
  if (prefix === '3') return '30000'; // West-Vlaanderen
  if (prefix2 === '23' || prefix2 === '24') return '20001'; // Vlaams-Brabant
  if (prefix === '9') return '20002'; // Waals-Brabant
  if (prefix === '5') return '50000'; // Henegouwen
  if (prefix === '6') return '60000'; // Luik
  if (prefix === '8') return '80000'; // Luxemburg
  if (prefix2 === '90' || prefix2 === '91' || prefix2 === '92' || prefix2 === '93') return '90000'; // Namen

  return '10000'; // Default fallback
}

export function getRegionForMunicipality(municipalityCode: number): RegionCode {
  const provCode = getProvinceForMunicipality(municipalityCode);
  return getRegionForProvince(provCode) || '1000';
}
