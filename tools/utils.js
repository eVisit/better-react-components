const FS = require('fs'),
      PATH = require('path'),
      colors = require('colors'),
      jsDiff = require('diff');

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

function showDiff(fileName, c1, c2) {
  jsDiff.createPatch(fileName, c1 || '', c2 || '').replace(/.*/g, function(m) {
    if (!m)
      return;

    var c = m.charAt(0),
        out = m;

    if (c === '-')
      console.log(out.red);
    else if (c === '+')
      console.log(out.green);
    else
      console.log(out);
  });
}

function updateAllPackageJSONs() {
  var masterPackageJSON = require(path.resolve(__dirname, '..', 'package.json')),
      masterVersion = masterPackageJSON.version;

  const updateAllDependencyVersions = (scope, version, json) => {
    if (!json.hasOwnProperty(scope))
      return;

    var thisScope = json[scope],
        keys = Object.keys();

    for (var i = 0, il = keys.length; i < il; i++) {
      var key = keys[i];
      if (!key.match(/^@react-ameliorate\//))
        continue;

      thisScope[key] = `^${version}`;
    }
  };

  walkFiles(PATH.join(__dirname, 'packages'), ({ fullFileName, isDirectory, path }) => {
    if (isDirectory)
      return;

    var packageName;
    fullFileName.replace(/\/packages\/([^\/]+)\//, (m, p) => {
      packageName = p;
    });

    var jsonContent = ('' + fs.readFileSync(fullFileName)),
        json = JSON.parse(jsonContent);

    json.repository = `https://github.com/eVisit/react-ameliorate/tree/master/packages/${packageName}`;
    json.name = `@react-ameliorate/${packageName.replace(/^react-ameliorate-/, '')}`;
    json.main = (packageName === 'react-ameliorate-core') ? 'index.js' : `./source/${packageName.replace(/^(react-ameliorate-component-|react-ameliorate-)/, '') + '.js'}`;
    json.homepage = `https://github.com/eVisit/react-ameliorate/tree/master/packages/${packageName}#readme`;

    updateAllDependencyVersions('dependencies', masterVersion, json);
    updateAllDependencyVersions('peerDependencies', masterVersion, json);
    //console.log({ repo: json.repository, name: json.name, main: json.main, homepage: json.homepage });

    var newJSONContent = JSON.stringify(json, undefined, 2);
    showDiff(fullFileName, jsonContent, newJSONContent);
    //FS.writeFileSync(fullFileName, JSON.stringify(json, undefined, 2));
  }, {
    filter: ({ fileName, stat }) => {
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

module.exports = {
  walkFiles,
  showDiff,
  updateAllPackageJSONs
};
