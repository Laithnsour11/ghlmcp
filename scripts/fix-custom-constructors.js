/**
 * Script to fix custom constructors in tool files that extend BaseTool
 */

const fs = require('fs');
const path = require('path');

// Tool files with custom constructors that need fixing
const toolsWithCustomConstructors = [
  'association-tools.ts',
  'custom-field-v2-tools.ts',
  'invoices-tools.ts',
  'payments-tools.ts',
  'products-tools.ts',
  'store-tools.ts',
  'survey-tools.ts',
  'workflow-tools.ts'
];

function fixCustomConstructor(fileName) {
  const filePath = path.join(__dirname, '..', 'src', 'tools', fileName);
  
  if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${filePath}`);
    return;
  }
  
  let content = fs.readFileSync(filePath, 'utf8');
  console.log(`Fixing custom constructor in ${fileName}...`);
  
  // Pattern 1: constructor(private apiClient: GHLApiClient) {}
  const privateApiClientPattern = /constructor\(private apiClient: GHLApiClient\) {\s*super\(\);\s*}/;
  if (privateApiClientPattern.test(content)) {
    content = content.replace(privateApiClientPattern, 'constructor(apiClient?: GHLApiClient) {\n    super(apiClient);\n  }');
    // Also replace this.apiClient with this.getClient()
    content = content.replace(/this\.apiClient/g, 'this.getClient()');
    console.log(`  ✓ Fixed private apiClient pattern`);
  }
  
  // Pattern 2: constructor(private ghlClient: GHLApiClient) { with body
  const privateGhlClientPattern = /constructor\(private ghlClient: GHLApiClient\) {([^}]+)}/;
  const match = content.match(privateGhlClientPattern);
  if (match) {
    const body = match[1];
    content = content.replace(
      privateGhlClientPattern,
      `constructor(ghlClient?: GHLApiClient) {\n    super(ghlClient);${body}}`
    );
    // Replace this.ghlClient with this.getClient()
    content = content.replace(/this\.ghlClient/g, 'this.getClient()');
    console.log(`  ✓ Fixed private ghlClient pattern`);
  }
  
  // Pattern 3: constructor() { with only super() call
  const emptyConstructorWithSuper = /constructor\(\) {\s*super\(\);\s*}/;
  if (emptyConstructorWithSuper.test(content)) {
    // This is already correct, no changes needed
    console.log(`  ✓ Constructor already correct`);
  }
  
  // Write the fixed file
  fs.writeFileSync(filePath, content, 'utf8');
}

// Run fixes
console.log('Fixing custom constructors in tool files...\n');

toolsWithCustomConstructors.forEach(file => {
  try {
    fixCustomConstructor(file);
  } catch (error) {
    console.error(`Failed to fix ${file}:`, error.message);
  }
});

console.log('\nCustom constructor fixes complete!');