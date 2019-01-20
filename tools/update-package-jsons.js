const FS = require('fs'),
      PATH = require('path'),
      { walkFiles, showDiff } = require('./utils');

function updateAllPackageJSONs() {
  var masterPackageJSON = require(PATH.resolve(__dirname, '..', 'package.json')),
      masterVersion = masterPackageJSON.version;

  const updateAllDependencyVersions = (scope, version, json) => {
    if (!json.hasOwnProperty(scope))
      return;

    var thisScope = json[scope],
        keys = Object.keys(thisScope);

    for (var i = 0, il = keys.length; i < il; i++) {
      var key = keys[i];
      if (!key.match(/^@react-ameliorate\//))
        continue;

      thisScope[key] = `^${version}`;
    }
  };

  walkFiles(PATH.resolve(__dirname, '..', 'packages'), ({ fullFileName, fileName, isDirectory, path }) => {
    var packageName = fileName,
        packageJSONFileName = PATH.join(fullFileName, 'package.json'),
        jsonContent = ('' + FS.readFileSync(packageJSONFileName)),
        json = JSON.parse(jsonContent);

    json.repository = `https://github.com/eVisit/react-ameliorate/tree/master/packages/${packageName}`;
    json.name = `@react-ameliorate/${packageName.replace(/^react-ameliorate-/, '')}`;
    json.homepage = `https://github.com/eVisit/react-ameliorate/tree/master/packages/${packageName}#readme`;

    updateAllDependencyVersions('dependencies', masterVersion, json);
    updateAllDependencyVersions('peerDependencies', masterVersion, json);
    //console.log({ repo: json.repository, name: json.name, main: json.main, homepage: json.homepage });

    var newJSONContent = (JSON.stringify(json, undefined, 2) + '\n');

    showDiff(fullFileName, jsonContent, newJSONContent);

    // if (newJSONContent !== jsonContent)
    //   FS.writeFileSync(packageJSONFileName, JSON.stringify(json, undefined, 2));
  }, {
    recurse: false,
    filter: ({ isDirectory }) => isDirectory
  });
}

updateAllPackageJSONs();
