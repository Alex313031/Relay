const fs = require("fs"); 
const path = require('path');
const rmdd = require('rimraf');

const buildDir = path.join(__dirname, '../build');

if (fs.existsSync(path.join(__dirname, '../build'))) {
  console.log('"build" already exists, cleaning...');
  fs.rmSync(buildDir, { recursive: true, force: true, verbose: true });
  fs.mkdirSync(buildDir);
  console.log('\nCreated directory "build"');
} else {
  fs.mkdirSync(buildDir);
  console.log('Created directory "build"');
}

if (fs.existsSync(path.join(__dirname, '../build'))) {
  fs.copyFileSync(path.join(__dirname, '../src/package.json'), path.join(__dirname, '../build/package.json'));
  console.log('\nCopied "src/package.json" -> "build/package.json"');
} else {
  console.log('\nError: ' + buildDir + ' not found');
}
