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

validateWithTsx();

function validateWithTsx() {
  const validatorScript = path.join(__dirname, 'validate-embed-paths-tsx.mjs');
  const scriptContent = `
import { EMBED_CONFIGS } from '../src/lib/embed-config.ts';
import { hasEmbedData } from '../src/lib/embed-data-registry.ts';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const analysesDir = path.join(__dirname, '../analyses');
const errors = [];
const warnings = [];
let validatedCount = 0;

console.log('🔍 Validating embed configuration...\\n');

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

      // Validate path traversal (security check)
      if (dataPath.includes('..') || dataPath.includes('~')) {
        errors.push(\`⚠️  [\${analysis.slug}/\${sectionId}] Path traversal detected in dataPath: \${dataPath}\`);
      }

      if (municipalitiesPath.includes('..') || municipalitiesPath.includes('~')) {
        errors.push(\`⚠️  [\${analysis.slug}/\${sectionId}] Path traversal detected in municipalitiesPath: \${municipalitiesPath}\`);
      }

      // Validate path consistency (path should start with analysis slug)
      if (!dataPath.startsWith(\`\${analysis.slug}/\`)) {
        errors.push(\`⚠️  [\${analysis.slug}/\${sectionId}] Data path doesn't start with analysis slug: \${dataPath}\`);
      }

      if (!municipalitiesPath.startsWith(\`\${analysis.slug}/\`)) {
        errors.push(\`⚠️  [\${analysis.slug}/\${sectionId}] Municipalities path doesn't start with analysis slug: \${municipalitiesPath}\`);
      }

      // Validate that data is registered in the data registry
      if (!hasEmbedData(analysis.slug, sectionId)) {
        errors.push(\`❌ [\${analysis.slug}/\${sectionId}] Data not registered in EMBED_DATA_REGISTRY (embed-data-registry.ts)\`);
      }
    }
  }
}

// Report results
console.log(\`\\n📊 Validation Summary:\`);
console.log(\`   Validated: \${validatedCount} file(s)\`);
console.log(\`   Warnings: \${warnings.length}\`);
console.log(\`   Errors: \${errors.length}\`);

if (warnings.length > 0) {
  console.warn('\\n⚠️  Warnings:\\n');
  warnings.forEach(warning => console.warn(\`   \${warning}\`));
}

if (errors.length > 0) {
  console.error('\\n❌ Validation failed with the following errors:\\n');
  errors.forEach(error => console.error(\`   \${error}\`));
  console.error('\\n💡 Fix these issues in:');
  console.error('   - src/lib/embed-config.ts (configuration)');
  console.error('   - src/lib/embed-data-registry.ts (data imports)\\n');
  process.exit(1);
}

console.log('\\n✅ All embed configuration is valid!\\n');
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
    console.error('❌ Failed to run tsx:', err);
    console.error('\n💡 Make sure tsx is installed:');
    console.error('   npm install -D tsx\n');

    // Clean up temp script
    try {
      fs.unlinkSync(validatorScript);
    } catch {
      // Ignore cleanup errors
    }

    process.exit(1);
  });
}
