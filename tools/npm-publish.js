const FS = require('fs'),
      PATH = require('path'),
      { walkFiles } = require('./utils');

function publishAllPackages() {
  walkFiles(PATH.resolve(__dirname, '..', 'packages'), ({ fullFileName, isDirectory, path }) => {
    console.log('Package: ', fullFileName);
  }, {
    recurse: false,
    filter: ({ isDirectory }) => isDirectory
  });
}

publishAllPackages();
