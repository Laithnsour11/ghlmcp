/**
 * Script to fix locationId usage in tool files
 * The GHL API client's createContact and searchContacts methods already handle locationId internally
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Find all tool files
const toolFiles = glob.sync(path.join(__dirname, '..', 'src', 'tools', '*-tools.ts'));

function fixLocationIdUsage(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  const fileName = path.basename(filePath);
  
  console.log(`Checking ${fileName}...`);
  
  let modified = false;
  
  // Pattern 1: locationId: this.getClient().getConfig().locationId,
  const pattern1 = /locationId: this\.getClient\(\)\.getConfig\(\)\.locationId,\s*/g;
  if (pattern1.test(content)) {
    content = content.replace(pattern1, '');
    modified = true;
    console.log(`  ✓ Removed getConfig().locationId usage`);
  }
  
  // Pattern 2: locationId: this.getClient().config.locationId,
  const pattern2 = /locationId: this\.getClient\(\)\.config\.locationId,\s*/g;
  if (pattern2.test(content)) {
    content = content.replace(pattern2, '');
    modified = true;
    console.log(`  ✓ Removed config.locationId usage`);
  }
  
  // Pattern 3: In createContact/searchContacts, the locationId is already handled by the API client
  // Remove any standalone locationId parameters in these methods
  const createContactPattern = /\.createContact\(\{[\s\S]*?\}\)/g;
  const searchContactsPattern = /\.searchContacts\(\{[\s\S]*?\}\)/g;
  
  // Function to clean locationId from method calls
  function cleanLocationId(match) {
    // Remove locationId: ..., lines
    return match.replace(/\s*locationId:[^,\n}]+,?\s*/g, '');
  }
  
  if (createContactPattern.test(content)) {
    content = content.replace(createContactPattern, cleanLocationId);
    modified = true;
  }
  
  if (searchContactsPattern.test(content)) {
    content = content.replace(searchContactsPattern, cleanLocationId);
    modified = true;
  }
  
  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`  ✓ Fixed ${fileName}`);
  } else {
    console.log(`  ✓ No changes needed`);
  }
}

console.log('Fixing locationId usage in tool files...\n');

toolFiles.forEach(file => {
  try {
    fixLocationIdUsage(file);
  } catch (error) {
    console.error(`Failed to fix ${file}:`, error.message);
  }
});

console.log('\nLocationId fixes complete!');