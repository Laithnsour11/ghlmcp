/**
 * Script to fix all tool constructors that have issues
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Find all tool files
const toolFiles = glob.sync(path.join(__dirname, '..', 'src', 'tools', '*-tools.ts'));

function fixToolConstructor(filePath) {
  const fileName = path.basename(filePath);
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  
  console.log(`Checking ${fileName}...`);
  
  // Pattern 1: Fix private apiClient/ghlClient constructors
  const privateConstructorPattern = /constructor\(private (apiClient|ghlClient): GHLApiClient\) {\s*(super\(\);\s*)?}/;
  if (privateConstructorPattern.test(content)) {
    content = content.replace(privateConstructorPattern, 
      'constructor($1?: GHLApiClient) {\n    super($1);\n  }');
    modified = true;
    console.log(`  ✓ Fixed private constructor pattern`);
  }
  
  // Pattern 2: Replace this.apiClient with this.getClient()
  if (/this\.apiClient(?!\?)/.test(content)) {
    content = content.replace(/this\.apiClient(?!\?)/g, 'this.getClient()');
    modified = true;
    console.log(`  ✓ Replaced this.apiClient with this.getClient()`);
  }
  
  // Pattern 3: Replace this.ghlClient with this.getClient()
  if (/this\.ghlClient(?!\?)/.test(content)) {
    content = content.replace(/this\.ghlClient(?!\?)/g, 'this.getClient()');
    modified = true;
    console.log(`  ✓ Replaced this.ghlClient with this.getClient()`);
  }
  
  // Pattern 4: Fix constructors with body that have private fields
  const constructorWithBodyPattern = /constructor\(private (apiClient|ghlClient): GHLApiClient\) {([^}]+)}/;
  const match = content.match(constructorWithBodyPattern);
  if (match) {
    const fieldName = match[1];
    const body = match[2];
    content = content.replace(
      constructorWithBodyPattern,
      `constructor(${fieldName}?: GHLApiClient) {\n    super(${fieldName});${body}}`
    );
    modified = true;
    console.log(`  ✓ Fixed constructor with body`);
  }
  
  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`  ✓ Saved changes to ${fileName}`);
  } else {
    console.log(`  ✓ No changes needed`);
  }
}

// Run fixes
console.log('Fixing all tool constructors...\n');

toolFiles.forEach(file => {
  try {
    fixToolConstructor(file);
  } catch (error) {
    console.error(`Failed to fix ${file}:`, error.message);
  }
});

console.log('\nAll tool constructor fixes complete!');