const fs = require('fs');
const path = require('path');

const walkDirs = [
    path.join(__dirname, 'src'),
    path.join(__dirname, 'tests')
];

const targets = ['middleware', 'controller', 'routes', 'repository', 'constants', 'validation', 'service', 'messageHandler', 'connection'];

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            results = results.concat(walk(file));
        } else {
            results.push(file);
        }
    });
    return results;
}

let allFiles = [];
walkDirs.forEach(d => {
    if (fs.existsSync(d)) allFiles = allFiles.concat(walk(d));
});
allFiles = allFiles.filter(f => f.endsWith('.js'));

allFiles.forEach(file => {
    const basename = path.basename(file);
    const parts = basename.split('.');
    
    if (parts.length >= 3 && parts[parts.length - 1] === 'js') {
        const type = parts[parts.length - 2];
        if (targets.includes(type)) {
            const prefix = parts.slice(0, parts.length - 2).join('.');
            const newType = type.charAt(0).toUpperCase() + type.slice(1);
            const newBasename = prefix + newType + '.js';
            const newPath = path.join(path.dirname(file), newBasename);
            
            fs.renameSync(file, newPath);
            console.log(`Renamed: ${basename} -> ${newBasename}`);
        }
    }
});

// Re-read all files because paths changed
let updatedFiles = [];
walkDirs.forEach(d => {
    if (fs.existsSync(d)) updatedFiles = updatedFiles.concat(walk(d));
});
updatedFiles = updatedFiles.filter(f => f.endsWith('.js'));

updatedFiles.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let changed = false;
    
    targets.forEach(type => {
        const newType = type.charAt(0).toUpperCase() + type.slice(1);
        
        // Match \.type['"] or \.type.js['"]
        const regex = new RegExp(`\\.${type}(?:\\.js)?(['"])`, 'g');
        if (regex.test(content)) {
            content = content.replace(regex, (match, p1) => {
                return newType + p1;
            });
            changed = true;
        }
    });
    
    if (changed) {
        fs.writeFileSync(file, content, 'utf8');
        console.log(`Updated requires in: ${path.basename(file)}`);
    }
});

console.log('Done!');
