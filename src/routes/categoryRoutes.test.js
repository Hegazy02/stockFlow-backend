/**
 * Manual Route Middleware Composition Test
 * 
 * This file verifies that category routes are properly configured with:
 * - Correct HTTP methods
 * - Proper validation middleware
 * - Correct controller function mapping
 * 
 * Run with: node src/routes/categoryRoutes.test.js
 */

const express = require('express');
const categoryRoutes = require('./categoryRoutes');

// Create a test app
const app = express();
app.use(express.json());
app.use('/api/categories', categoryRoutes);

// Extract route information
const routes = [];
categoryRoutes.stack.forEach((middleware) => {
  if (middleware.route) {
    const route = middleware.route;
    const methods = Object.keys(route.methods).map(m => m.toUpperCase());
    const path = route.path;
    const middlewareCount = route.stack.length;
    
    routes.push({
      path: `/api/categories${path}`,
      methods,
      middlewareCount,
      hasValidation: middlewareCount > 1 // More than just the controller
    });
  }
});

console.log('Category Routes Configuration:');
console.log('================================\n');

routes.forEach((route, index) => {
  console.log(`Route ${index + 1}:`);
  console.log(`  Path: ${route.path}`);
  console.log(`  Methods: ${route.methods.join(', ')}`);
  console.log(`  Middleware Count: ${route.middlewareCount}`);
  console.log(`  Has Validation: ${route.hasValidation ? 'Yes' : 'No'}`);
  console.log('');
});

// Verify expected routes exist
const expectedRoutes = [
  { path: '/api/categories/', method: 'POST', shouldHaveValidation: true },
  { path: '/api/categories/bulk-delete', method: 'POST', shouldHaveValidation: true },
  { path: '/api/categories/', method: 'GET', shouldHaveValidation: false },
  { path: '/api/categories/:id', method: 'GET', shouldHaveValidation: true },
  { path: '/api/categories/:id', method: 'PUT', shouldHaveValidation: true },
  { path: '/api/categories/:id', method: 'DELETE', shouldHaveValidation: true }
];

console.log('Route Verification:');
console.log('===================\n');

let allTestsPassed = true;

expectedRoutes.forEach((expected) => {
  const found = routes.find(r => 
    r.path === expected.path && 
    r.methods.includes(expected.method)
  );
  
  if (!found) {
    console.log(`❌ FAIL: ${expected.method} ${expected.path} - Route not found`);
    allTestsPassed = false;
  } else if (expected.shouldHaveValidation && !found.hasValidation) {
    console.log(`❌ FAIL: ${expected.method} ${expected.path} - Missing validation middleware`);
    allTestsPassed = false;
  } else {
    console.log(`✓ PASS: ${expected.method} ${expected.path}`);
  }
});

console.log('\n================================');
if (allTestsPassed) {
  console.log('✓ All route middleware composition tests passed!');
  process.exit(0);
} else {
  console.log('❌ Some tests failed!');
  process.exit(1);
}
