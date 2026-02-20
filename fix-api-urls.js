const fs = require('fs');
const path = require('path');

const directory = './frontend/app';
const oldUrl = 'http://localhost:8000';
const newUrl = 'https://api-nine-ochre-18.vercel.app';

function processFile(filePath) {
  if (!filePath.endsWith('.tsx') && !filePath.endsWith('.ts')) return;
  
  let content = fs.readFileSync(filePath, 'utf8');
  const originalContent = content;
  
  content = content.split(oldUrl).join(newUrl);
  
  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated: ${filePath}`);
  }
}

function walkDir(dir) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      walkDir(filePath);
    } else {
      processFile(filePath);
    }
  });
}

walkDir(directory);
console.log('Done!');
