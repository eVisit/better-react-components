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
        stat = FS.lstatSync(fullFileName);

    if (typeof filter === 'function' && !filter(fullFileName, fileName, stat, walkFiles))
      continue;

    if (stat.isDirectory())
      walkFiles(fullFileName, cb, opts);
    else if (stat.isFile())
      cb(fullFileName, fileName, walkPath);
  }
}

walkFiles(PATH.join(__dirname, 'packages'), (fullFileName, fileName) => {
  var packageName;
  fullFileName.replace(/\/packages\/([^\/]+)\//, (m, p) => {
    packageName = p;
  });

  var json = require(fullFileName);
  json.repository = `https://github.com/eVisit/react-ameliorate/tree/master/packages/${packageName}`;
  json.name = `@react-ameliorate/${packageName}`;
  json.main = packageName.replace(/^(react-ameliorate-component-|react-ameliorate-)/, '') + '.js';
  json.homepage = `https://github.com/eVisit/react-ameliorate/tree/master/packages/${packageName}`;

  //console.log({ repo: json.repository, name: json.name, main: json.main, homepage: json.homepage });

  FS.writeFileSync(fullFileName, JSON.stringify(json, undefined, 2));
}, {
  filter: (fullFileName, fileName, stat) => {
    if (stat.isDirectory())
      return (!fileName.match(/^(react-ameliorate-react-native-shims)$/));

    return (fileName === 'package.json');
  }
});

