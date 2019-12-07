var FileSystem                    = require('fs'),
    Path                          = require('path'),
    PATHS                         = require('./paths'),
    { raBuildPreprocessorConfig } = require('@react-ameliorate/pre-processor');

function readDirectories(rootPath, cb) {
  var files = FileSystem.readdirSync(rootPath);

  for (var i = 0, il = files.length; i < il; i++) {
    var fileName = files[i],
        fullFileName = Path.join(rootPath, fileName),
        stat = FileSystem.lstatSync(fullFileName),
        isDirectory = stat.isDirectory();

    if (!isDirectory)
      continue;

    cb(fileName, fullFileName);
  }
}

function readReactAmelioratePackages(cb) {
  var rootPath = PATHS.resolvePath(PATHS.PROJECT_ROOT, 'node_modules', '@react-ameliorate');
  readDirectories(rootPath, cb);
}

// This allows module redirection... so for example
// you could overload Button by:
// import { Button as _Button } from '@react-ameliorate-base/component-button';
// and then inheriting from _Button on your own Button component.
// This module redirection also replaces all Buttons used in react-ameliorate
// with your own overloaded Button (i.e. in modals, etc...)
function buildReactAmeliorateAliases() {
  var aliases = {};

  readReactAmelioratePackages((fileName, fullFileName) => {
    var packageName = fileName.replace(/^react-ameliorate-/, ''),
        aliasName = `@react-ameliorate/${packageName}`;

    aliases[aliasName] = fullFileName;
    aliases[`@react-ameliorate-base/${packageName}`] = fullFileName;
  });

  readDirectories(PATHS.resolvePath(PATHS.PROJECT_ROOT, 'node_modules'), (fileName, fullFileName) => {
    if (fileName.match(/(react-native|@react-ameliorate)/))
      return;

    aliases[fileName] = fullFileName;
  });

  return aliases;
}

function buildReactAmeliorateModules() {
  var theseModules = [];

  readReactAmelioratePackages((fileName, fullFileName) => {
    theseModules.push(fullFileName);
  });

  return theseModules;
}

const reactAmeliorateModules = buildReactAmeliorateModules(),
      webpackResolve = {
        extensions: [ '.js', '.json' ],
        alias: Object.assign({
          '@common':                    PATHS.resolvePath(PATHS.PROJECT_ROOT, 'common'),
          '@root':                      PATHS.resolvePath(PATHS.APP_SRC),
          '@base':                      PATHS.resolvePath(PATHS.APP_SRC, 'base'),
          '@components':                PATHS.resolvePath(PATHS.APP_SRC, 'components'),
          '@lang':                      PATHS.resolvePath(PATHS.APP_SRC, 'lang'),
          '@mixins':                    PATHS.resolvePath(PATHS.APP_SRC, 'mixins'),
          '@modals':                    PATHS.resolvePath(PATHS.APP_SRC, 'modals'),
          '@pages':                     PATHS.resolvePath(PATHS.APP_SRC, 'pages'),
          'react-native-dynamic-fonts': PATHS.resolvePath(PATHS.APP_SRC, 'base', 'shims', 'dynamic-fonts')
        }, buildReactAmeliorateAliases(), {
          '@react-ameliorate/core':     PATHS.resolvePath(PATHS.APP_SRC, 'base'),
          '@react-ameliorate/styles':   PATHS.resolvePath(PATHS.APP_SRC, 'base', 'theme')
        }),
        modules: ['node_modules'].concat(reactAmeliorateModules)
      };

const compilerIncludePatterns = [PATHS.APP_SRC].concat(reactAmeliorateModules);

module.exports = {
  PATHS,
  resolve: webpackResolve,
  webpack: {
    entry: [ '@babel/polyfill', PATHS.APP_INDEX ],
    output: {
      path: PATHS.APP_PUBLIC_BUNDLE,
      publicPath: 'js',
      filename: 'bundle.js'
    },
    resolve: webpackResolve
  },
  compilerIncludePatterns,
  modules: {
    rules: [
      {
        test: /\.css$/,
        loader: 'style-loader!css-loader',
      },
      {
        // Standard js/jsx compilation.
        test: /\.jsx?$/,
        include: compilerIncludePatterns,
        use: [
          {
            loader: 'babel-loader',
            query: {
              cacheDirectory: false,
              babelrc: false,
              presets: [
                '@babel/preset-env',
                'module:babel-preset-react-ameliorate'
              ],
              plugins: [
                '@babel/plugin-proposal-class-properties'
              ]
            }
          },
          {
            loader: './example.config.js',
            options: raBuildPreprocessorConfig({
              projectRoot: PATHS.PROJECT_ROOT,
              appName: 'Example App',
              appVersion: '1.0.0',
              browser: {
                // This would be used in a source file as follows:
                //    //###if(EXTRA_PREPROCESSOR_VARIABLE_DECLARATION === 'test'){###//
                //    doSomething();
                //    //###}else{###//
                //    doSomethingElse();
                //    //###}###//
                EXTRA_PREPROCESSOR_VARIABLE_DECLARATION: 'test'
              }
            }).browser
          }
        ]
      }
    ]
  }
};
