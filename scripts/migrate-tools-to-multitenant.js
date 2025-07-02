/**
 * Script to migrate tool classes to multi-tenant support
 * This script will help convert tool classes to extend BaseTool
 */

const fs = require('fs');
const path = require('path');

// List of tool files to migrate (excluding contact-tools which has an example)
const toolFiles = [
  'association-tools.ts',
  'blog-tools.ts',
  'calendar-tools.ts',
  'contact-tools.ts',
  'conversation-tools.ts',
  'custom-field-v2-tools.ts',
  'email-isv-tools.ts',
  'email-tools.ts',
  'invoices-tools.ts',
  'location-tools.ts',
  'media-tools.ts',
  'object-tools.ts',
  'opportunity-tools.ts',
  'payments-tools.ts',
  'products-tools.ts',
  'social-media-tools.ts',
  'store-tools.ts',
  'survey-tools.ts',
  'workflow-tools.ts'
];

function migrateToolFile(fileName) {
  const filePath = path.join(__dirname, '..', 'src', 'tools', fileName);
  
  if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${filePath}`);
    return;
  }
  
  let content = fs.readFileSync(filePath, 'utf8');
  const className = fileName.replace(/-tools\.ts$/, '')
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join('') + 'Tools';
  
  console.log(`Migrating ${fileName} (${className})...`);
  
  // Check if already migrated
  if (content.includes('extends BaseTool')) {
    console.log(`  ✓ Already migrated`);
    return;
  }
  
  // Add BaseTool import
  if (!content.includes("import { BaseTool }")) {
    const toolImportRegex = /import { Tool } from '@modelcontextprotocol\/sdk\/types\.js';/;
    if (toolImportRegex.test(content)) {
      content = content.replace(
        toolImportRegex,
        `import { Tool } from '@modelcontextprotocol/sdk/types.js';\nimport { BaseTool } from './base-tool.js';`
      );
    } else {
      // Add after first import
      const firstImportMatch = content.match(/import .* from .*;/);
      if (firstImportMatch) {
        const insertIndex = firstImportMatch.index + firstImportMatch[0].length;
        content = content.slice(0, insertIndex) + 
          `\nimport { BaseTool } from './base-tool.js';` + 
          content.slice(insertIndex);
      }
    }
  }
  
  // Update class declaration
  const classRegex = new RegExp(`export class ${className} {`);
  if (classRegex.test(content)) {
    content = content.replace(
      classRegex,
      `export class ${className} extends BaseTool {`
    );
  }
  
  // Remove constructor that only stores ghlClient
  const constructorRegex = /constructor\(private ghlClient: GHLApiClient\) {}/;
  if (constructorRegex.test(content)) {
    content = content.replace(constructorRegex, '// Constructor removed - using BaseTool');
  } else {
    // Handle constructor with body
    const constructorWithBodyRegex = /constructor\(private ghlClient: GHLApiClient\) {\s*}/;
    if (constructorWithBodyRegex.test(content)) {
      content = content.replace(constructorWithBodyRegex, '// Constructor removed - using BaseTool');
    }
  }
  
  // Replace this.ghlClient with this.getClient()
  content = content.replace(/this\.ghlClient/g, 'this.getClient()');
  
  // Add logging to main execute methods
  const executeMethodRegex = /(async executeTool\(toolName: string, params: any\): Promise<any> {)/;
  if (executeMethodRegex.test(content)) {
    content = content.replace(
      executeMethodRegex,
      `$1\n    this.log(\`Executing tool: \${toolName}\`, { params });`
    );
  }
  
  // Update error handling to use this.logError
  content = content.replace(
    /console\.error\(/g,
    'this.logError('
  );
  
  // Update console.log to this.log
  content = content.replace(
    /console\.log\(/g,
    'this.log('
  );
  
  // Write the migrated file
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`  ✓ Migration complete`);
}

// Run migration
console.log('Starting tool migration to multi-tenant support...\n');

toolFiles.forEach(file => {
  try {
    migrateToolFile(file);
  } catch (error) {
    console.error(`Failed to migrate ${file}:`, error.message);
  }
});

console.log('\nMigration script complete!');
console.log('\nNOTE: Please review the migrated files and:');
console.log('1. Fix any compilation errors');
console.log('2. Update method implementations to use this.executeWithLogging() where appropriate');
console.log('3. Add this.validateRequired() and this.sanitizeParams() for input validation');
console.log('4. Test thoroughly to ensure functionality is preserved');