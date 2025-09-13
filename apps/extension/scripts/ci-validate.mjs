import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class ValidationError extends Error {
  constructor(message, code) {
    super(message);
    this.code = code;
  }
}

function validateManifest(manifestPath) {
  console.log(`🔍 Validating manifest: ${manifestPath}`);

  if (!existsSync(manifestPath)) {
    throw new ValidationError(`Manifest not found: ${manifestPath}`, 'MANIFEST_NOT_FOUND');
  }

  let manifest;
  try {
    manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
  } catch (error) {
    throw new ValidationError(`Invalid JSON in manifest: ${error.message}`, 'INVALID_JSON');
  }

  const errors = [];
  const warnings = [];

  // Check 1: No localhost anywhere
  const manifestStr = JSON.stringify(manifest);
  const localhostMatches = manifestStr.match(/localhost|127\.0\.0\.1/g);
  if (localhostMatches) {
    errors.push(`Found localhost references: ${localhostMatches.join(', ')}`);
  }

  // Check 2: No unsafe-inline/unsafe-eval in CSP
  if (manifest.content_security_policy?.extension_pages) {
    const csp = manifest.content_security_policy.extension_pages;
    if (csp.includes('unsafe-inline')) {
      errors.push('CSP contains unsafe-inline');
    }
    if (csp.includes('unsafe-eval')) {
      errors.push('CSP contains unsafe-eval');
    }
  }

  // Check 3: All hosts HTTPS
  const hostFields = ['host_permissions', 'optional_host_permissions'];
  hostFields.forEach(field => {
    if (manifest[field]) {
      manifest[field].forEach(host => {
        if (!host.startsWith('https://') && !host.startsWith('chrome-extension://')) {
          errors.push(`Non-HTTPS host in ${field}: ${host}`);
        }
      });
    }
  });

  // Check 4: Essential permissions only
  const unnecessaryPermissions = ['tabs', 'webRequest', 'cookies', 'activeTab'];
  if (manifest.permissions) {
    manifest.permissions.forEach(perm => {
      if (unnecessaryPermissions.includes(perm)) {
        warnings.push(`Consider removing permission: ${perm}`);
      }
    });
  }

  // Check 5: Version format
  if (manifest.version && !/^\d+\.\d+\.\d+$/.test(manifest.version)) {
    errors.push(`Invalid version format: ${manifest.version} (should be X.Y.Z)`);
  }

  // Check 6: Required fields
  const requiredFields = ['manifest_version', 'name', 'version'];
  requiredFields.forEach(field => {
    if (!manifest[field]) {
      errors.push(`Missing required field: ${field}`);
    }
  });

  // Check 7: Icon sizes
  if (manifest.icons) {
    const requiredSizes = ['16', '48', '128'];
    requiredSizes.forEach(size => {
      if (!manifest.icons[size]) {
        warnings.push(`Missing icon size: ${size}px`);
      }
    });
  }

  // Check 8: OAuth redirect URI validation
  if (manifest.oauth2?.client_id) {
    // Note: Extension ID will be different in production
    console.log('   OAuth client ID present - ensure redirect URI is allow-listed');
    if (manifest.oauth2.client_id.includes('localhost') || manifest.oauth2.client_id.includes('127.0.0.1')) {
      errors.push('OAuth client ID appears to be for development');
    }
  }

  return { errors, warnings, manifest };
}

async function validateBuild(distPath) {
  console.log(`📦 Validating build output: ${distPath}`);

  // Check for source maps in production
  const { readdirSync, statSync } = await import('fs');
  try {
    const files = readdirSync(distPath);
    const sourceMaps = files.filter(f => f.endsWith('.map'));
    if (sourceMaps.length > 0) {
      console.log(`⚠️  Found ${sourceMaps.length} source map files - consider excluding from production`);
    }

    // Check for large files
    let totalSize = 0;
    const largeFiles = [];

    files.forEach(file => {
      const filePath = join(distPath, file);
      try {
        const stats = statSync(filePath);
        if (stats.isFile()) {
          totalSize += stats.size;
          if (stats.size > 1024 * 1024) { // > 1MB
            largeFiles.push(`${file} (${(stats.size / 1024 / 1024).toFixed(1)}MB)`);
          }
        }
      } catch (err) {
        // Skip files we can't stat
      }
    });

    if (largeFiles.length > 0) {
      console.log(`⚠️  Large files found: ${largeFiles.join(', ')}`);
    }

    const sizeMB = (totalSize / 1024 / 1024).toFixed(2);
    console.log(`   Total build size: ${sizeMB}MB`);

    if (totalSize > 128 * 1024 * 1024) {
      throw new ValidationError('Build exceeds Chrome Web Store 128MB limit', 'SIZE_LIMIT');
    }

  } catch (error) {
    console.log(`⚠️  Could not validate build directory: ${error.message}`);
  }
}

async function main() {
  const manifestPath = process.argv[2] || join(__dirname, '../dist/manifest.json');

  try {
    const { errors, warnings, manifest } = validateManifest(manifestPath);

    // Print results
    if (warnings.length > 0) {
      console.log('\n⚠️  Warnings:');
      warnings.forEach(warning => console.log(`   ${warning}`));
    }

    if (errors.length > 0) {
      console.log('\n❌ Errors:');
      errors.forEach(error => console.log(`   ${error}`));
      console.log(`\n💥 Validation failed with ${errors.length} error(s)`);
      process.exit(1);
    }

    // Additional build validation
    const distPath = dirname(manifestPath);
    await validateBuild(distPath);

    console.log('\n✅ All validation checks passed!');
    console.log(`   Extension: ${manifest.name} v${manifest.version}`);
    console.log(`   Manifest: ${manifestPath}`);

  } catch (error) {
    console.error(`❌ Validation failed: ${error.message}`);
    process.exit(error.code === 'ENOENT' ? 2 : 1);
  }
}

// Allow both module and script usage
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('Unexpected error:', error);
    process.exit(3);
  });
}