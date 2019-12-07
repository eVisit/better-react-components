var path = require('path');

function raBuildPreprocessorConfig(_opts) {
  var opts = _opts || {},
      projectRoot = opts.projectRoot,
      projectName,
      projectVersion;

  try {
    var packageJSON = require(path.resolve(projectRoot, 'package.json'));
    projectName = packageJSON.name;
    projectVersion = packageJSON.version;
  } catch (e) {}

  if (opts.appName)
    projectName = opts.appName;

  if (opts.appVersion)
    opts.projectVersion = opts.appVersion;

  var variables = {
    TEST: false,
    DEV: false,
    PLATFORM: 'desktop',
    PLATFORM_GENERIC: 'browser',
    MOBILE: false,
    BROWSER: true,
    ELECTRON: false,
    PROJECT_ROOT: projectRoot,
    APP_NAME: projectName,
    APP_VERSION: projectVersion
  };

  return {
    browser: Object.assign({}, variables, {
      PLATFORM: 'desktop',
      PLATFORM_GENERIC: 'browser',
      MOBILE: false,
      BROWSER: true,
      ELECTRON: false,
    }, opts.browser || {}),
    mobile: Object.assign({}, variables, {
      PLATFORM: 'mobile',
      PLATFORM_GENERIC: 'mobile',
      MOBILE: true,
      BROWSER: false,
      ELECTRON: false,
    }, opts.modile || {}),
    electron: Object.assign({}, variables, {
      PLATFORM: 'electron',
      PLATFORM_GENERIC: 'browser',
      MOBILE: false,
      BROWSER: true,
      ELECTRON: true
    }, opts.electron || {})
  };
}

module.exports = {
  raBuildPreprocessorConfig
};
