const FS = require('fs'),
      PATH = require('path'),
      colors = require('colors'),
      jsDiff = require('diff'),
      { execSync } = require('child_process');

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
  var targetPath = PATH.resolve(__dirname, '..', '..', 'source-project', 'client', 'source', 'components');

  walkFiles(PATH.resolve(__dirname, '..', 'packages'), ({ fullFileName, fileName, isDirectory, path }) => {
    if (!isDirectory)
      return;

    if (!fileName.match(/component/))
      return;

    var name = fileName.replace(/^react-ameliorate-component-/, ''),
        targetComponentPath = PATH.join(targetPath, name),
        sourceComponentPath = PATH.join(fullFileName, 'source');

    if (!FS.existsSync(targetComponentPath))
      return;

    execSync(`cp ${PATH.join(targetComponentPath, `${name}.js`)} ${PATH.join(sourceComponentPath, `${name}.js`)}`);
    execSync(`cp ${PATH.join(targetComponentPath, `${name}-styles.js`)} ${PATH.join(sourceComponentPath, `${name}-styles.js`)}`);
  }, {
    recurse: false
  });
}

// structureHelper();

module.exports = {
  walkFiles,
  showDiff
};
