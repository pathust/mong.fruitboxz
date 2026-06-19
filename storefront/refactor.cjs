const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

walkDir('./src/pages/admin', function(filePath) {
  if (!filePath.endsWith('.jsx')) return;
  if (filePath.includes('Settings.jsx')) return;
  
  let content = fs.readFileSync(filePath, 'utf-8');
  
  if (content.includes('admin-panel') && !content.includes('AdminHeaderPortal')) {
    const depth = filePath.split('/').length - 3;
    const prefix = '../'.repeat(depth);
    const importStatement = `import { AdminHeaderPortal } from "${prefix}components/admin/AdminHeaderPortal"\n`;
    content = content.replace(/import .*\n/, match => match + importStatement);
    
    // Instead of parsing divs, let's just find the first <div className="admin-panel...
    // and the first </div> that is at the same indentation level!
    // Since we formatted with Prettier, the indentation is consistent.
    const lines = content.split('\n');
    let startLineIdx = -1;
    let endLineIdx = -1;
    let indentLength = 0;
    
    for (let i = 0; i < lines.length; i++) {
      if (startLineIdx === -1 && lines[i].includes('className="admin-panel')) {
        startLineIdx = i;
        indentLength = lines[i].search(/\S/);
      } else if (startLineIdx !== -1) {
        // find closing div at same indentation
        const currentIndent = lines[i].search(/\S/);
        if (currentIndent === indentLength && lines[i].trim().startsWith('</div>')) {
          endLineIdx = i;
          break;
        }
      }
    }
    
    if (startLineIdx !== -1 && endLineIdx !== -1) {
      lines[startLineIdx] = lines[startLineIdx].replace(/<div className="admin-panel[^>]*>/, '<AdminHeaderPortal>\n' + ' '.repeat(indentLength + 2) + '<div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between w-full pr-4">');
      
      for (let i = startLineIdx; i <= endLineIdx; i++) {
        lines[i] = lines[i].replace(/<h1 className="page-title[^>]*>/, '<h1 className="text-lg font-extrabold text-[#4d4339] flex items-center gap-2">');
        lines[i] = lines[i].replace(/<p className="product-meta[^>]*>/g, '<p className="text-xs font-semibold text-[#8d7f6f] hidden md:block">');
      }
      
      lines[endLineIdx] = lines[endLineIdx].replace('</div>', '</div>\n' + ' '.repeat(indentLength) + '</AdminHeaderPortal>');
      
      fs.writeFileSync(filePath, lines.join('\n'));
      console.log('Refactored ' + filePath);
    } else {
      console.log("Failed to find boundaries for", filePath);
    }
  }
});
