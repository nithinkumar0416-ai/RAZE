const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');

console.log('🚀 Running RAZE AI Universal Build...');

if (fs.existsSync('client')) {
  console.log('📁 Detected root directory. Installing client dependencies and building...');
  execSync('cd client && npm install && npm run build', { stdio: 'inherit', shell: true });
  
  const srcDist = path.join(process.cwd(), 'client', 'dist');
  const targetDist = path.join(process.cwd(), 'dist');
  
  if (fs.existsSync(srcDist)) {
    fs.cpSync(srcDist, targetDist, { recursive: true });
    console.log('✓ Successfully mirrored client/dist -> ./dist');
  }
} else {
  console.log('📁 Detected client directory context. Building directly...');
  execSync('npm run build', { stdio: 'inherit', shell: true });
}

console.log('✨ RAZE AI Build completed successfully!');
