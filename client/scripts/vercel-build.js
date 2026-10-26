const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');

console.log('🚀 Running RAZE AI Universal Build (client context)...');

if (fs.existsSync('client')) {
  console.log('📁 Detected root directory. Installing client dependencies and building...');
  execSync('cd client && npm install && npm run build', { stdio: 'inherit', shell: true });
} else {
  console.log('📁 Detected client directory context. Building directly...');
  execSync('npm run build', { stdio: 'inherit', shell: true });
}

console.log('✨ RAZE AI Build completed successfully!');
