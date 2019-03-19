const FS = require('fs'),
      PATH = require('path'),
      { walkFiles } = require('./utils'),
      { execSync } = require('child_process');

function publishAllPackages() {
  walkFiles(PATH.resolve(__dirname, '..', 'packages'), ({ fullFileName, isDirectory, path }) => {
    console.log('Publishing Package: ', fullFileName);
    execSync(`npm publish --access=public`, {
      cwd: fullFileName
    });
  }, {
    recurse: false,
    filter: ({ isDirectory }) => isDirectory
  });
}

publishAllPackages();
