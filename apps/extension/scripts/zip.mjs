import { statSync } from 'fs';
import { readdir } from 'fs/promises';
import { join } from 'path';

async function createZip(sourceDir, outputFile) {
  console.log(`📦 Creating extension archive: ${outputFile}`);

  try {
    // Quick validation - check if manifest exists
    const manifestPath = join(sourceDir, 'manifest.json');
    const manifestContent = await import('fs').then(fs => fs.promises.readFile(manifestPath, 'utf8'));
    const manifest = JSON.parse(manifestContent);

    console.log(`   Extension: ${manifest.name} v${manifest.version}`);

    // Calculate directory size
    const files = await readdir(sourceDir, { recursive: true });
    let totalSize = 0;

    for (const file of files) {
      try {
        const stats = statSync(join(sourceDir, file));
        if (stats.isFile()) {
          totalSize += stats.size;
        }
      } catch (err) {
        // Skip files we can't stat
      }
    }

    const sizeMB = (totalSize / 1024 / 1024).toFixed(2);
    console.log(`   Size: ${sizeMB}MB`);

    if (totalSize > 128 * 1024 * 1024) { // 128MB Chrome limit
      console.warn('⚠️  WARNING: Extension size exceeds Chrome Web Store limit (128MB)');
    }

    // Create ZIP using system command
    const { execSync } = await import('child_process');
    const { basename } = await import('path');
    const cmd = `cd "${sourceDir}/.." && zip -r "${outputFile}" "${basename(sourceDir)}" -x "*.map" "*/.DS_Store" "*/node_modules/*"`;

    execSync(cmd, { stdio: 'pipe' });
    console.log(`✅ Created ${outputFile}`);

  } catch (error) {
    if (error.code === 'ENOENT' && error.path?.includes('zip')) {
      console.error('❌ ZIP command not available. Please install zip or manually compress the dist/ folder');
    } else {
      console.error('❌ Archive creation failed:', error.message);
    }
    process.exit(1);
  }
}

// CLI usage
const [,, sourceDir, outputFile] = process.argv;

if (!sourceDir || !outputFile) {
  console.error('Usage: node zip.mjs <source-dir> <output-file>');
  process.exit(1);
}

await createZip(sourceDir, outputFile);