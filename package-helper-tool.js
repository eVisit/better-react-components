//export * from '@react-ameliorate/core';

const FS = require('fs'),
      PATH = require('path');

function walkFiles(walkPath, cb, _opts) {
  var opts = _opts || {},
      files = FS.readdirSync(walkPath),
      filter = opts.filter;

  for (var i = 0, il = files.length; i < il; i++) {
    var fileName = files[i],
        fullFileName = PATH.join(walkPath, fileName),
        stat = FS.lstatSync(fullFileName),
        isDirectory = stat.isDirectory(),
        args = { fullFileName, fileName, stat, walkFiles, isDirectory, path: walkPath };

    if (typeof filter === 'function' && !filter(args))
      continue;

    if (isDirectory) {
      if (opts.recurse !== false)
        walkFiles(fullFileName, cb, opts);
    } else if (!stat.isFile()) {
      continue;
    }

    cb(args);
  }
}

function updateAllPackageJSONs() {
  walkFiles(PATH.join(__dirname, 'packages'), ({ fullFileName, isDirectory }) => {
    if (isDirectory)
      return;

    var packageName;
    fullFileName.replace(/\/packages\/([^\/]+)\//, (m, p) => {
      packageName = p;
    });

    var json = require(fullFileName);
    json.repository = `https://github.com/eVisit/react-ameliorate/tree/master/packages/${packageName}`;
    json.name = `@react-ameliorate/${packageName.replace(/^react-ameliorate-/, '')}`;
    json.main = (packageName === 'react-ameliorate-core') ? 'index.js' : packageName.replace(/^(react-ameliorate-component-|react-ameliorate-)/, '') + '.js';
    json.homepage = `https://github.com/eVisit/react-ameliorate/tree/master/packages/${packageName}`;

    // console.log({ repo: json.repository, name: json.name, main: json.main, homepage: json.homepage });

    FS.writeFileSync(fullFileName, JSON.stringify(json, undefined, 2));
  }, {
    filter: ({ fileName, stat }) => {
      if (stat.isDirectory())
        return (!fileName.match(/^(react-ameliorate-react-native-shims)$/));

      return (fileName === 'package.json');
    }
  });
}

function copySupportFilesToPackages() {
  var files = [
    '.eslintrc',
    '.npmignore',
    'LICENSE'
  ].map((name) => {
    var fullFileName = PATH.join(__dirname, name);

    return {
      name,
      fullFileName,
      contents: FS.readFileSync(fullFileName)
    };
  });

  walkFiles(PATH.join(__dirname, 'packages'), ({ fileName, isDirectory, path }) => {
    if (!isDirectory)
      return;

    files.forEach((thisFile) => {
      var writePath = PATH.join(path, fileName, thisFile.name);
      console.log('Write: ', thisFile.name, ' -> ', writePath);
      FS.writeFileSync(writePath, thisFile.contents);
    });
  }, {
    recurse: false
  });
}

function structureHelper() {
  walkFiles(PATH.join(__dirname, 'packages'), ({ fullFileName, fileName, isDirectory, path }) => {
    if (!isDirectory)
      return;

    var finalName = PATH.join(fullFileName, 'source');
    //console.log('THIS: ', finalName);
    try {
      FS.mkdirSync(finalName);
    } catch (e) {}
  }, {
    recurse: false
  });
}

//updateAllPackageJSONs();
//copySupportFilesToPackages();
structureHelper();
