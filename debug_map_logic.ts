
import { getProvinceForMunicipality, getRegionForMunicipality } from './embuild-analyses/src/lib/geo-utils';

const mockFeatures = [
  { properties: { code: "11001" } }, // Antwerpen
  { properties: { code: "70000" } }, // Limburg (Wait, 70000 is a province code, but maybe a municipality code too? No, 7xxxx are municipalities in Limburg)
  { properties: { code: "71002" } }, // Hasselt (Limburg)
  { properties: { code: "21004" } }, // Brussels
  { properties: { code: "81001" } }, // Arlon (Luxembourg)
];

const level = 'province';
const selectedProvince = '70000'; // Limburg
const selectedRegion = '2000'; // Flanders (Limburg is in Flanders)

const filtered = mockFeatures.filter((feature: any) => {
  const code = parseInt(feature.properties.code);
  
  console.log(`Checking ${code}: Province=${getProvinceForMunicipality(code)}`);

  if (level === 'province' && selectedProvince) {
    return getProvinceForMunicipality(code) === selectedProvince;
  }
  
  if (level === 'region' && selectedRegion !== '1000') {
    return getRegionForMunicipality(code) === selectedRegion;
  }
  
  return true;
});

console.log(`Filtered count: ${filtered.length}`);
console.log(filtered);
