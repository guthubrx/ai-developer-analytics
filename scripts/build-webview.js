const { execSync } = require('child_process');
const path = require('path');

console.log('Building React/Vite webview...');

try {
  // Change to webview directory
  const webviewDir = path.join(__dirname, '..', 'webview');

  // Install dependencies if node_modules doesn't exist
  if (!require('fs').existsSync(path.join(webviewDir, 'node_modules'))) {
    console.log('Installing webview dependencies...');
    execSync('npm install', { cwd: webviewDir, stdio: 'inherit' });
  }

  // Build the webview
  console.log('Building webview with Vite...');
  execSync('npm run build', { cwd: webviewDir, stdio: 'inherit' });

  console.log('✅ Webview build completed successfully!');
} catch (error) {
  console.error('❌ Webview build failed:', error.message);
  process.exit(1);
}