/**
 * Script to fix constructor issues in tool classes that extend BaseTool
 */

const fs = require('fs');
const path = require('path');

// Tool files that have custom constructors
const toolsWithConstructors = [
  'association-tools.ts',
  'custom-field-v2-tools.ts',
  'invoices-tools.ts',
  'payments-tools.ts',
  'products-tools.ts',
  'store-tools.ts',
  'survey-tools.ts',
  'workflow-tools.ts'
];

function fixConstructor(fileName) {
  const filePath = path.join(__dirname, '..', 'src', 'tools', fileName);
  
  if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${filePath}`);
    return;
  }
  
  let content = fs.readFileSync(filePath, 'utf8');
  console.log(`Fixing constructor in ${fileName}...`);
  
  // For files with empty constructor body
  const emptyConstructorRegex = /constructor\(\) {\s*}/;
  if (emptyConstructorRegex.test(content)) {
    content = content.replace(emptyConstructorRegex, 'constructor() {\n    super();\n  }');
  }
  
  // For files with constructor that has body but no super call
  const constructorWithBodyRegex = /constructor\(\) {([^}]+)}/;
  const match = content.match(constructorWithBodyRegex);
  if (match && !match[0].includes('super()')) {
    const constructorBody = match[1];
    content = content.replace(
      constructorWithBodyRegex,
      `constructor() {\n    super();${constructorBody}}`
    );
  }
  
  // Write the fixed file
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`  ✓ Fixed constructor`);
}

// Fix EmailISVTools separately as it has a different issue
function fixEmailISVTools() {
  const filePath = path.join(__dirname, '..', 'src', 'tools', 'email-isv-tools.ts');
  let content = fs.readFileSync(filePath, 'utf8');
  
  // The EmailISVTools doesn't extend BaseTool but tries to use getClient
  // We need to make it extend BaseTool
  if (!content.includes('extends BaseTool')) {
    content = content.replace(
      'export class EmailISVTools {',
      'export class EmailISVTools extends BaseTool {'
    );
    
    // Add BaseTool import if not present
    if (!content.includes("import { BaseTool }")) {
      const toolImportRegex = /import { Tool } from '@modelcontextprotocol\/sdk\/types\.js';/;
      if (toolImportRegex.test(content)) {
        content = content.replace(
          toolImportRegex,
          `import { Tool } from '@modelcontextprotocol/sdk/types.js';\nimport { BaseTool } from './base-tool.js';`
        );
      }
    }
    
    // Remove the old constructor
    content = content.replace(/constructor\(private ghlClient: GHLApiClient\) {}/, '');
    
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Fixed EmailISVTools to extend BaseTool');
  }
}

// Run fixes
console.log('Fixing constructor issues in tool files...\n');

toolsWithConstructors.forEach(file => {
  try {
    fixConstructor(file);
  } catch (error) {
    console.error(`Failed to fix ${file}:`, error.message);
  }
});

// Fix EmailISVTools
try {
  fixEmailISVTools();
} catch (error) {
  console.error('Failed to fix EmailISVTools:', error.message);
}

console.log('\nConstructor fixes complete!');