const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            results = results.concat(walk(file));
        } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
            results.push(file);
        }
    });
    return results;
}

const files = walk('e:/AI/baosocial/apps/web/src');
let updatedCount = 0;

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let changed = false;

    // Replace 'http://localhost:3001...' with `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}...`
    // Ensure we don't double replace
    const regex = /(?<!NEXT_PUBLIC_API_URL \|\| |NEXT_PUBLIC_API_URL \?\? )(['"`])http:\/\/localhost:3001([^'"`]*)\1/g;

    let newContent = content.replace(regex, (match, quote, path) => {
        changed = true;
        return `\`\${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}${path}\``;
    });

    if (changed) {
        fs.writeFileSync(file, newContent, 'utf8');
        console.log('Updated ' + file);
        updatedCount++;
    }
});

console.log(`Updated ${updatedCount} files.`);
