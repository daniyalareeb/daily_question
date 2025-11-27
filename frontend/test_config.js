/**
 * Test script to validate frontend configuration
 * Run with: node test_config.js
 */

const requiredEnvVars = {
  'REACT_APP_API_URL': process.env.REACT_APP_API_URL,
  'REACT_APP_SUPABASE_URL': process.env.REACT_APP_SUPABASE_URL,
  'REACT_APP_SUPABASE_ANON_KEY': process.env.REACT_APP_SUPABASE_ANON_KEY,
};

console.log('='.repeat(50));
console.log('Frontend Configuration Test');
console.log('='.repeat(50));

const errors = [];
const warnings = [];

console.log('\n📋 Environment Variables:');
Object.entries(requiredEnvVars).forEach(([key, value]) => {
  if (value) {
    const displayValue = key.includes('KEY') || key.includes('URL') 
      ? `${value.substring(0, 30)}...` 
      : value;
    console.log(`  ✅ ${key}: ${displayValue}`);
  } else {
    console.log(`  ❌ ${key}: Missing`);
    errors.push(key);
  }
});

// Test Supabase client initialization
if (requiredEnvVars.REACT_APP_SUPABASE_URL && requiredEnvVars.REACT_APP_SUPABASE_ANON_KEY) {
  console.log('\n🔌 Testing Supabase Client:');
  try {
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(
      requiredEnvVars.REACT_APP_SUPABASE_URL,
      requiredEnvVars.REACT_APP_SUPABASE_ANON_KEY
    );
    console.log('  ✅ Supabase client can be initialized');
  } catch (error) {
    console.log(`  ❌ Supabase client initialization failed: ${error.message}`);
    errors.push('Supabase client initialization');
  }
}

// Summary
console.log('\n' + '='.repeat(50));
if (errors.length > 0) {
  console.log('❌ Configuration Errors Found:');
  errors.forEach(error => console.log(`   - ${error}`));
  console.log('\nPlease set the missing environment variables in .env file');
  process.exit(1);
} else {
  console.log('✅ Configuration is valid!');
  process.exit(0);
}




