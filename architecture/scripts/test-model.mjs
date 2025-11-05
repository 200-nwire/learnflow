#!/usr/bin/env node
/**
 * Test script to validate the LikeC4 model
 * Tests loading and computing the architecture model
 */

import { LikeC4 } from 'likec4';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(__dirname, '..');

async function testModel() {
  console.log('🔍 Testing LikeC4 Architecture Model...\n');

  try {
    // Load from workspace
    console.log('📂 Loading workspace from:', projectRoot);
    const likec4 = await LikeC4.fromWorkspace(projectRoot);
    
    // Compute the model
    console.log('⚙️  Computing model...');
    const model = likec4.computedModel();
    
    // Validate model
    console.log('\n✅ Model loaded successfully!\n');
    
    // Print model stats
    console.log('📊 Model Statistics:');
    console.log('─'.repeat(50));
    
    // Access model properties correctly
    const elements = Object.values(model.elements || {});
    const relations = Object.values(model.relations || {});
    const views = Object.values(model.views || {});
    
    console.log(`   Total Elements: ${elements.length}`);
    console.log(`   Total Relations: ${relations.length}`);
    console.log(`   Total Views: ${views.length}`);
    
    console.log('\n📋 Views:');
    views.forEach(view => {
      console.log(`   • ${view.id} - "${view.title || 'Untitled'}"`);
    });
    
    console.log('\n🎯 Element Types:');
    const elementTypes = new Map();
    elements.forEach(el => {
      const kind = el.kind || 'unknown';
      elementTypes.set(kind, (elementTypes.get(kind) || 0) + 1);
    });
    
    Array.from(elementTypes.entries())
      .sort((a, b) => b[1] - a[1])
      .forEach(([kind, count]) => {
        console.log(`   • ${kind}: ${count}`);
      });
    
    console.log('\n🔗 Sample Relations:');
    relations.slice(0, 5).forEach(rel => {
      console.log(`   • ${rel.source} → ${rel.target}`);
    });
    
    if (relations.length > 5) {
      console.log(`   ... and ${relations.length - 5} more`);
    }
    
    // Test specific elements
    console.log('\n🔍 Testing Key Components:');
    
    const intelligenceApi = elements.find(el => 
      el.id.includes('intelligenceApi') || el.title?.includes('Intelligence API')
    );
    
    const bigQueryGold = elements.find(el => 
      el.id.includes('bigQueryGold') || el.title?.includes('Gold Layer')
    );
    
    const neo4j = elements.find(el => 
      el.id.includes('neo4j') || el.title?.includes('Neo4j')
    );
    
    if (intelligenceApi) {
      console.log(`   ✓ Intelligence API found: ${intelligenceApi.id}`);
    } else {
      console.log(`   ⚠️  Intelligence API not found`);
    }
    
    if (bigQueryGold) {
      console.log(`   ✓ BigQuery Gold Layer found: ${bigQueryGold.id}`);
    } else {
      console.log(`   ⚠️  BigQuery Gold Layer not found`);
    }
    
    if (neo4j) {
      console.log(`   ✓ Neo4j Graph found: ${neo4j.id}`);
    } else {
      console.log(`   ⚠️  Neo4j Graph not found`);
    }
    
    console.log('\n✨ All tests passed!\n');
    
    return 0;
  } catch (error) {
    console.error('\n❌ Error testing model:');
    console.error(error.message);
    if (error.stack) {
      console.error('\nStack trace:');
      console.error(error.stack);
    }
    return 1;
  }
}

// Run the test
testModel()
  .then(code => process.exit(code))
  .catch(err => {
    console.error('Unexpected error:', err);
    process.exit(1);
  });

