/**
 * Build-time validation script for embed configuration paths
 *
 * This script validates that all data paths referenced in EMBED_CONFIGS
 * point to existing files, catching typos and missing files at build time
 * instead of runtime.
 */

const fs = require('fs');
const path = require('path');

// Import the embed config
// Note: We use a require hook to handle TypeScript/ES modules
const configPath = path.join(__dirname, '../src/lib/embed-config.ts');

// Read and parse the config file manually since it's TypeScript
const configContent = fs.readFileSync(configPath, 'utf-8');

// Extract EMBED_CONFIGS array using regex (simple approach for validation)
const embedConfigsMatch = configContent.match(/export const EMBED_CONFIGS.*?=\s*\[([\s\S]*?)\n\]/);

if (!embedConfigsMatch) {
  console.error('❌ Could not find EMBED_CONFIGS in embed-config.ts');
  process.exit(1);
}

// Parse the configuration manually
const configText = embedConfigsMatch[1];
const slugMatches = [...configText.matchAll(/slug:\s*["']([^"']+)["']/g)];
const dataPathMatches = [...configText.matchAll(/dataPath:\s*["']([^"']+)["']/g)];
const municipalitiesPathMatches = [...configText.matchAll(/municipalitiesPath:\s*["']([^"']+)["']/g)];

const analysesDir = path.join(__dirname, '../analyses');
const errors = [];
let validatedCount = 0;

console.log('🔍 Validating embed configuration paths...\n');

// Validate data paths
dataPathMatches.forEach((match, index) => {
  const dataPath = match[1];
  const fullPath = path.join(analysesDir, dataPath);

  if (!fs.existsSync(fullPath)) {
    errors.push(`❌ Data file not found: ${dataPath}`);
  } else {
    console.log(`✅ ${dataPath}`);
    validatedCount++;
  }
});

// Validate municipalities paths
municipalitiesPathMatches.forEach((match, index) => {
  const municipalitiesPath = match[1];
  const fullPath = path.join(analysesDir, municipalitiesPath);

  if (!fs.existsSync(fullPath)) {
    errors.push(`❌ Municipalities file not found: ${municipalitiesPath}`);
  } else {
    console.log(`✅ ${municipalitiesPath}`);
    validatedCount++;
  }
});

// Report results
console.log(`\n📊 Validation Summary:`);
console.log(`   Validated: ${validatedCount} file(s)`);
console.log(`   Errors: ${errors.length}`);

if (errors.length > 0) {
  console.error('\n❌ Validation failed with the following errors:\n');
  errors.forEach(error => console.error(`   ${error}`));
  console.error('\n💡 Fix these issues in src/lib/embed-config.ts\n');
  process.exit(1);
}

console.log('\n✅ All embed configuration paths are valid!\n');
