import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const MODE = process.env.MODE || 'prod';
const EXTENSION_ROOT = join(__dirname, '..');

function transformManifest(manifest, mode) {
  const result = JSON.parse(JSON.stringify(manifest)); // Deep clone

  if (mode === 'dev') {
    console.log('🔧 Applying development transformations...');

    // Add localhost to CSP for development
    if (result.content_security_policy?.extension_pages) {
      let csp = result.content_security_policy.extension_pages;

      // Add localhost to connect-src if not present
      if (!csp.includes('http://127.0.0.1:8000')) {
        csp = csp.replace(
          'connect-src \'self\'',
          'connect-src \'self\' http://127.0.0.1:8000'
        );
      }

      result.content_security_policy.extension_pages = csp;
      console.log('   Added localhost to CSP for development');
    }

    // Add localhost to optional_host_permissions for development
    if (!result.optional_host_permissions.includes('http://127.0.0.1:8000/*')) {
      result.optional_host_permissions.unshift('http://127.0.0.1:8000/*');
      console.log('   Added localhost to optional_host_permissions');
    }

  } else {
    console.log('🚀 Using production configuration (secure CSP, no localhost)');

    // Ensure no localhost in CSP for production
    if (result.content_security_policy?.extension_pages) {
      let csp = result.content_security_policy.extension_pages;
      csp = csp.replace(/\s*http:\/\/127\.0\.0\.1:\d+/g, '');
      result.content_security_policy.extension_pages = csp;
    }
  }

  return result;
}

function main() {
  try {
    console.log(`🚀 Building manifest for ${MODE} mode`);

    // Read source manifest
    const manifestPath = join(EXTENSION_ROOT, 'public/manifest.json');
    const sourceManifest = JSON.parse(readFileSync(manifestPath, 'utf8'));

    // Transform for target mode
    const transformedManifest = transformManifest(sourceManifest, MODE);

    // Write to temp file that Vite will use
    const tempPath = join(EXTENSION_ROOT, 'public/manifest.temp.json');
    writeFileSync(tempPath, JSON.stringify(transformedManifest, null, 2));

    console.log(`✅ ${MODE} manifest written to ${tempPath} (Vite will copy to dist)`);

  } catch (error) {
    console.error('❌ Build failed:', error.message);
    process.exit(1);
  }
}

main();