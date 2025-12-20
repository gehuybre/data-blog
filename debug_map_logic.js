
// Copied from geo-utils.ts
const PROVINCES = [
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

function getProvinceForMunicipality(municipalityCode) {
  const code = municipalityCode.toString();
  if (code.startsWith('21')) return '21000'; // Brussels
  
  const prefix = code.substring(0, 1);
  const prefix2 = code.substring(0, 2);

  if (prefix === '1') return '10000'; // Antwerpen
  if (prefix === '7') return '70000'; // Limburg
  if (prefix === '4') return '40000'; // Oost-Vlaanderen
  if (prefix === '3') return '30000'; // West-Vlaanderen
  if (prefix2 === '23' || prefix2 === '24') return '20001'; // Vlaams-Brabant
  if (prefix2 === '25') return '20002'; // Waals-Brabant
  if (prefix === '5') return '50000'; // Henegouwen
  if (prefix === '6') return '60000'; // Luik
  if (prefix === '8') return '80000'; // Luxemburg
  if (prefix === '9') return '90000'; // Namen
  
  return '10000'; // Default fallback
}

function getRegionForProvince(provinceCode) {
  return PROVINCES.find(p => p.code === provinceCode)?.regionCode;
}

function getRegionForMunicipality(municipalityCode) {
  const provCode = getProvinceForMunicipality(municipalityCode);
  return getRegionForProvince(provCode) || '1000';
}

// Test Logic
const mockFeatures = [
  { properties: { code: "11001" } }, // Antwerpen
  { properties: { code: "71002" } }, // Hasselt (Limburg)
  { properties: { code: "81001" } }, // Arlon (Luxembourg)
];

const level = 'province';
const selectedProvince = '70000'; // Limburg
const selectedRegion = '2000'; // Flanders

console.log(`Testing Level: ${level}, SelectedProvince: ${selectedProvince}`);

const filtered = mockFeatures.filter((feature) => {
  const code = parseInt(feature.properties.code);
  const prov = getProvinceForMunicipality(code);
  
  console.log(`Checking ${code}: Province=${prov}, Match=${prov === selectedProvince}`);

  if (level === 'province' && selectedProvince) {
    return prov === selectedProvince;
  }
  
  if (level === 'region' && selectedRegion !== '1000') {
    return getRegionForMunicipality(code) === selectedRegion;
  }
  
  return true;
});

console.log(`Filtered count: ${filtered.length}`);
console.log(filtered);
