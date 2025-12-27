#!/usr/bin/env node
/**
 * Build-time validation script for embed configuration paths
 *
 * This script validates that all data paths referenced in EMBED_CONFIGS
 * point to existing files, catching typos and missing files at build time
 * instead of runtime.
 *
 * Uses tsx to directly import the TypeScript config for robust parsing.
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// Check if tsx is available
const hasTsx = (() => {
  try {
    require.resolve('tsx');
    return true;
  } catch {
    return false;
  }
})();

if (hasTsx) {
  // Use tsx to import TypeScript directly
  validateWithTsx();
} else {
  // Fallback to regex-based validation with a warning
  console.warn('⚠️  tsx not found - using fallback regex validation');
  console.warn('   Install tsx for more robust validation: npm install -D tsx\n');
  validateWithRegex();
}

function validateWithTsx() {
  const validatorScript = path.join(__dirname, 'validate-embed-paths-tsx.mjs');
  const scriptContent = `
import { EMBED_CONFIGS } from '../src/lib/embed-config.ts';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const analysesDir = path.join(__dirname, '../analyses');
const errors = [];
let validatedCount = 0;

console.log('🔍 Validating embed configuration paths...\\n');

for (const analysis of EMBED_CONFIGS) {
  for (const [sectionId, config] of Object.entries(analysis.sections)) {
    if (config.type === 'standard') {
      // Validate data path
      const dataPath = config.dataPath;
      const fullDataPath = path.join(analysesDir, dataPath);

      if (!fs.existsSync(fullDataPath)) {
        errors.push(\`❌ [\${analysis.slug}/\${sectionId}] Data file not found: \${dataPath}\`);
      } else {
        console.log(\`✅ \${dataPath}\`);
        validatedCount++;
      }

      // Validate municipalities path
      const municipalitiesPath = config.municipalitiesPath;
      const fullMunicipalitiesPath = path.join(analysesDir, municipalitiesPath);

      if (!fs.existsSync(fullMunicipalitiesPath)) {
        errors.push(\`❌ [\${analysis.slug}/\${sectionId}] Municipalities file not found: \${municipalitiesPath}\`);
      } else {
        console.log(\`✅ \${municipalitiesPath}\`);
        validatedCount++;
      }

      // Validate path consistency (path should start with analysis slug)
      if (!dataPath.startsWith(\`\${analysis.slug}/\`)) {
        errors.push(\`⚠️  [\${analysis.slug}/\${sectionId}] Data path doesn't start with analysis slug: \${dataPath}\`);
      }

      if (!municipalitiesPath.startsWith(\`\${analysis.slug}/\`)) {
        errors.push(\`⚠️  [\${analysis.slug}/\${sectionId}] Municipalities path doesn't start with analysis slug: \${municipalitiesPath}\`);
      }
    }
  }
}

// Report results
console.log(\`\\n📊 Validation Summary:\`);
console.log(\`   Validated: \${validatedCount} file(s)\`);
console.log(\`   Errors: \${errors.length}\`);

if (errors.length > 0) {
  console.error('\\n❌ Validation failed with the following errors:\\n');
  errors.forEach(error => console.error(\`   \${error}\`));
  console.error('\\n💡 Fix these issues in src/lib/embed-config.ts\\n');
  process.exit(1);
}

console.log('\\n✅ All embed configuration paths are valid!\\n');
`;

  // Write temporary validator script
  fs.writeFileSync(validatorScript, scriptContent);

  // Run with tsx
  const tsx = spawn('npx', ['tsx', validatorScript], {
    stdio: 'inherit',
    shell: true,
  });

  tsx.on('close', (code) => {
    // Clean up temp script
    try {
      fs.unlinkSync(validatorScript);
    } catch (err) {
      // Ignore cleanup errors
    }

    process.exit(code);
  });

  tsx.on('error', (err) => {
    console.error('Failed to run tsx:', err);
    console.warn('Falling back to regex validation...\n');

    // Clean up temp script
    try {
      fs.unlinkSync(validatorScript);
    } catch {
      // Ignore cleanup errors
    }

    validateWithRegex();
  });
}

function validateWithRegex() {
  const configPath = path.join(__dirname, '../src/lib/embed-config.ts');
  const configContent = fs.readFileSync(configPath, 'utf-8');

  // Extract EMBED_CONFIGS array using regex
  const embedConfigsMatch = configContent.match(/export const EMBED_CONFIGS.*?=\s*\[([\s\S]*?)\n\]/);

  if (!embedConfigsMatch) {
    console.error('❌ Could not find EMBED_CONFIGS in embed-config.ts');
    process.exit(1);
  }

  // Parse the configuration manually
  const configText = embedConfigsMatch[1];
  const dataPathMatches = [...configText.matchAll(/dataPath:\s*["']([^"']+)["']/g)];
  const municipalitiesPathMatches = [...configText.matchAll(/municipalitiesPath:\s*["']([^"']+)["']/g)];

  const analysesDir = path.join(__dirname, '../analyses');
  const errors = [];
  let validatedCount = 0;

  console.log('🔍 Validating embed configuration paths...\n');

  // Validate data paths
  dataPathMatches.forEach((match) => {
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
  municipalitiesPathMatches.forEach((match) => {
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
}
