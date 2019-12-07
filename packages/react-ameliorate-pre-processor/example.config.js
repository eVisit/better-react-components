const loaderUtils                           = require("loader-utils"),
      Path                                  = require('Path'),
      FileSystem                            = require('FileSystem'),
      PATHS                                 = require('../client/config/paths'),
      packageJSON                           = require('../package.json'),
      { raPuildPreprocessorTemplateRunner } = require('@react-ameliorate/pre-processor');

function getOptions(context) {
  if (context && context.loaders)
    return loaderUtils.getOptions(context);

  if (context && context.getOptions instanceof Function)
    return context.getOptions();

  return {};
}

function getFileName(context) {
  if (context && context.resourcePath)
    return context.resourcePath;

  if (context && context.getFileName instanceof Function)
    return context.getFileName();

  return '<unknown.js>';
}

function getMacroHelpers(context) {
  if (context && context.macros)
    return context.macros;

  if (context && context.getMacros instanceof Function)
    return context.getMacros();

  return [];
}

function debugOutput(source) {
  var index = 1;
  console.log(source.replace(/\n/g, function () {
    return '\n' + (index++) + ': ';
  }));
}

// This is designed to be used as a webpack loader
// Can also be used as a transformer for Jest or React Native (rn-cli.config.js)
module.exports = function(source) {
  var specifiedOptions  = getOptions(this),
      fileName          = getFileName(this, specifiedOptions),
      macros            = getMacroHelpers(this);

  var templateOptions = (options, writeToOutput) => {
    return Object.assign({}, specifiedOptions, {
      macros,
      __FILENAME: fileName,
      __DIRNAME: Path.resolve(Path.dirname(fileName)),
      FS: FileSystem,
      PATH: Path,
      LOG: function() {
        for (var args = new Array(arguments.length + 1), i = 0, il = arguments.length; i < il; i++)
          args[i + 1] = arguments[i];

        args[0] = 'COMPILER LOG: ';
        return console.log.apply(console, args);
      },
      WARN: function() {
        for (var args = new Array(arguments.length + 1), i = 0, il = arguments.length; i < il; i++)
          args[i + 1] = arguments[i];

        args[0] = 'COMPILER WARNING: ';
        return console.log.apply(console, args);
      },
      ERROR: function() {
        for (var args = new Array(arguments.length + 1), i = 0, il = arguments.length; i < il; i++)
          args[i + 1] = arguments[i];

        args[0] = 'COMPILER ERROR: ';
        return console.log.apply(console, args);
      },
      UTILS: {
        loadJSON: (jsonPath) => {
          var contents = FileSystem.readFileSync(jsonPath, { encoding: 'utf8' });
          return JSON.parse('' + contents);
        }
      },
      // Automatic module importer
      IMPORT_ALL: function(specifiedPath) {
        function importSorter(a, b) {
          return (a.importOrder - b.importOrder);
        }

        var baseDir     = options.__DIRNAME,
            importPath  = (specifiedPath) ? Path.resolve(baseDir, specifiedPath) : baseDir,
            imports     = FileSystem.readdirSync(importPath).map((_fileName) => {
              var fullFileName = Path.join(importPath, _fileName),
                  fileName = Path.relative(baseDir, fullFileName);

              if (!fileName.match(/^(\.|\\|\/)/))
                fileName = `./${fileName}`;

              return {
                fullFileName,
                fileName
              };
            }).filter(({ fullFileName }) => FileSystem.statSync(fullFileName).isDirectory());

        imports = imports.map(({ fullFileName, fileName }) => {
          var packageJSON;

          try {
            var packageJSONPath = Path.join(fullFileName, 'package.json');
            packageJSON = require(packageJSONPath);
          } catch (e) {
            packageJSON = {};
          }

          var autoImport = packageJSON.autoImport;
          if (('' + autoImport).match(/^(false|disabled)$/)) {
            if (autoImport !== 'disabled')
              options.WARN('Not auto importing [' + fileName + '] component because autoImport=false in package.json');

            return;
          }

          var N = 'C' + options.IMPORT_INDEX;
          options.IMPORT_INDEX++;

          return Object.assign({}, {
            fileName,
            autoImport: true,
            importOrder: 999,
            importName: N,
          }, packageJSON);
        }).filter((name) => !!name).sort(importSorter);

        imports.forEach((importInfo) => {
          writeToOutput("export * from '", importInfo.fileName, "';\n");
        });
      }
    });
  };

  var template        = raPuildPreprocessorTemplateRunner(fileName, source, templateOptions),
      templateOutput  = template();

  if (runningDirectly) {
    debugOutput(source);
    debugOutput(templateOutput);
  }

  return templateOutput;
};
module.exports.raw = true;

// This pre-processor config can be run directly on any file to see the output
// i.e. node example.config.js app/some.file.to.compile.js
const runningDirectly = (process.argv[1] === __filename);

if (runningDirectly) {
  (function () {
    var FileSystem = require('FileSystem'),
      inputFileName = process.argv[2];

    module.exports.call({
      getOptions: () => {
        return {
          DEV: true,
          PLATFORM: 'desktop',
          PLATFORM_GENERIC: 'browser',
          MOBILE: false,
          BROWSER: true,
          ELECTRON: false,
          PROJECT_ROOT: PATHS.APP_SRC,
          APP_NAME: packageJSON.name,
          APP_VERSION: packageJSON.version
        };
      },
      getFileName: () => {
        return (inputFileName.charAt(0).match(/^(\.|\/|\\)/)) ? inputFileName : `./${inputFileName}`;
      },
      getMacros: () => []
    }, FileSystem.readFileSync(inputFileName).toString());
  })();
}
