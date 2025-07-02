/**
 * Script to fix getConfig().locationId usage in tool files
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Find all tool files
const toolFiles = glob.sync(path.join(__dirname, '..', 'src', 'tools', '*-tools.ts'));

function fixGetConfigUsage(filePath) {
  const fileName = path.basename(filePath);
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  
  console.log(`Checking ${fileName}...`);
  
  // Pattern: this.getClient().getConfig().locationId
  const getConfigPattern = /this\.getClient\(\)\.getConfig\(\)\.locationId/g;
  if (getConfigPattern.test(content)) {
    // In most cases, the locationId is already part of the API client configuration
    // So we can just remove the locationId parameter entirely from requests
    content = content.replace(getConfigPattern, '""'); // Empty string as placeholder
    modified = true;
    console.log(`  ✓ Fixed getConfig().locationId usage`);
  }
  
  // Pattern: params.locationId || this.getClient().getConfig().locationId
  const fallbackPattern = /params\.locationId \|\| this\.getClient\(\)\.getConfig\(\)\.locationId/g;
  if (fallbackPattern.test(content)) {
    content = content.replace(fallbackPattern, 'params.locationId || ""');
    modified = true;
    console.log(`  ✓ Fixed locationId fallback pattern`);
  }
  
  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`  ✓ Saved changes to ${fileName}`);
  } else {
    console.log(`  ✓ No changes needed`);
  }
}

// Run fixes
console.log('Fixing getConfig() usage in tool files...\n');

toolFiles.forEach(file => {
  try {
    fixGetConfigUsage(file);
  } catch (error) {
    console.error(`Failed to fix ${file}:`, error.message);
  }
});

console.log('\ngetConfig() usage fixes complete!');