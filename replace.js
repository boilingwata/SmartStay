const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else {
      if (file.endsWith('.tsx')) results.push(file);
    }
  });
  return results;
}

const files = walk('C:\\Users\\toduc\\Downloads\\SmartStay\\src\\views\\portal');
files.forEach(f => {
  let content = fs.readFileSync(f, 'utf8');
  if (content.includes('max-w-[430px]')) {
    content = content.split('max-w-[430px]').join('w-full');
    fs.writeFileSync(f, content);
    console.log('Modified', f);
  }
});
