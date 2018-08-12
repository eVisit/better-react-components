const utils = require('evisit-js-utils');

const D = utils.data,
      U = utils.utils;

var styleSheetID = 1;

class StyleSheetBuilder {
  constructor({ thisSheetID, styleExports, sheetName, theme, platform, factory, mergeStyles, resolveStyles, onUpdate }) {
    if (!(factory instanceof Function))
      throw new Error('Theme factory must be a function');

    U.defineROProperty(this, 'styleExports', styleExports);
    U.defineROProperty(this, 'sheetName', sheetName);
    U.defineROProperty(this, 'theme', theme);
    U.defineROProperty(this, 'factory', factory);
    U.defineROProperty(this, '_styleSheetID', thisSheetID);
    U.defineROProperty(this, '_mergeStyles', mergeStyles);
    U.defineROProperty(this, '_resolveStyles', resolveStyles);
    U.defineROProperty(this, '_onUpdate', onUpdate);
    U.defineRWProperty(this, '_style', null);
    U.defineRWProperty(this, '_rawStyle', null);
    U.defineRWProperty(this, '_cachedBaseStyles', null);
    U.defineRWProperty(this, '_lastStyleUpdateTime', 0);
    U.defineRWProperty(this, '_lastRawStyleUpdateTime', 0);

    U.defineROProperty(this, 'platform', undefined, () => {
      if (!U.noe(platform))
        return platform;

      return (this.theme) ? this.theme.getPlatform() : undefined;
    });
  }

  static createInternalStyleSheet(styleObj) {
    return Object.assign({}, (styleObj || {}));
  }

  static flattenInternalStyleSheet(style) {
    return Object.assign({}, (style || {}));
  }

  static getStyleSheet(props) {
    return new StyleSheetBuilder(props);
  }

  static createStyleSheet(factory, props = {}) {
    function styleSheetName(name) {
      // TODO: get sheet name via throw
    }

    var thisSheetID = styleSheetID++,
        mergeStyles = (props instanceof Array) ? props : props.mergeStyles,
        resolveStyles = props.resolveStyles,
        styleExports = {},
        onUpdate = props.onUpdate;

    if (U.noe(mergeStyles))
      mergeStyles = [];

    if (U.noe(resolveStyles))
      resolveStyles = [];

    var sheetName = (props.name) ? '' + props.name : styleSheetName(),
        styleFunction = function(theme, platform) {
          return StyleSheetBuilder.getStyleSheet({ thisSheetID, styleExports, sheetName, theme, platform, factory, mergeStyles, resolveStyles, onUpdate });
        };

    Object.defineProperty(styleFunction, '_styleFactory', {
      writable: false,
      enumerable: false,
      configurable: false,
      value: true
    });

    Object.defineProperty(styleFunction, '_sheetName', {
      writable: false,
      enumerable: false,
      configurable: false,
      value: sheetName
    });

    return styleFunction;
  }

  static buildCSSFromStyle(style, selector) {
    function getRuleName(key) {
      if (key === 'textDecorationLine')
        return 'text-decoration';

      return key.replace(/[A-Z]/g, function(m) {
        return '-' + (m.toLowerCase());
      });
    }

    function getRuleValue(key, ruleName, ruleValue) {
      if (ruleName === 'text-decoration')
        return ruleValue;

      if ((ruleValue instanceof Number) || typeof ruleValue === 'number')
        return ruleValue + 'px';

      return ruleValue;
    }

    if (!style) {
      console.warn('Warning: The specified style is empty. Ignoring.');
      return;
    }

    if (!selector) {
      console.warn('Warning: The specified selector is empty. Ignoring.');
      return;
    }

    var flatStyle = this.flattenStyle(style),
        cssStyle = [selector, '{'],
        keys = Object.keys(flatStyle);

    for (var i = 0, il = keys.length; i < il; i++) {
      var key = keys[i],
          ruleName = getRuleName(key),
          ruleValue = getRuleValue(key, ruleName, flatStyle[key]);

      cssStyle.push(ruleName);
      cssStyle.push(':');
      cssStyle.push(ruleValue);
      cssStyle.push(';');
    }

    cssStyle.push('}');

    return cssStyle.join('');
  }

  static buildCSSFromStyles(_styleArray, _uuid) {
    var styleArray = (_styleArray instanceof Array) ? _styleArray : [_styleArray],
        css = [],
        uuid = (_uuid) ? ('.' + _uuid + ' ') : '';

    for (var i = 0, il = styleArray.length; i < il; i++) {
      var style = styleArray[i],
          selector = U.get(style, 'selector', '');

      if ((typeof selector === 'string' || selector instanceof String) && selector.match(/,/))
        selector = selector.split(/\s*,\s*/g).map((s) => s.trim()).filter((s) => !!s);

      if (selector instanceof Array)
        selector = selector.join(',' + uuid);

      css.push(StyleSheetBuilder.buildCSSFromStyle(style.style, uuid + selector));
    }

    return css.join(' ');
  }

  styleWithHelper(helper, ...args) {
    function resolveAllStyles(styles, finalStyles) {
      for (var i = 0, il = styles.length; i < il; i++) {
        var style = styles[i];

        if (typeof style === 'string' || (style instanceof String)) {
          var styleName = style;
          style = sheet[style];

          if (typeof helper === 'function')
            style = helper(this, styleName, style, sheet);
        }

        if (style instanceof Array) {
          resolveAllStyles.call(this, style, finalStyles);
        } else if (style) {
          if (U.instanceOf(style, 'object'))
            style = this.sanitizeProps(style, this.platform);

          finalStyles.push(style);
        }
      }
    }

    var sheet = this.getInternalStyleSheet(),
        sheetName = this.sheetName,
        mergedStyles = [];

    resolveAllStyles.call(this, args, mergedStyles);

    if (this.platform)
      return (mergedStyles.length > 1) ? mergedStyles : mergedStyles[0];

    return this.flattenStyle((mergedStyles.length > 1) ? mergedStyles : mergedStyles[0]);
  }

  style(...args) {
    return this.styleWithHelper(null, ...args);
  }

  styleProp(name, defaultProp) {
    var rawStyle = this.getRawStyle();
    return (!U.noe(rawStyle[name])) ? rawStyle[name] : defaultProp;
  }

  resolveDependencies(dependencies) {
    var styles = [];

    // Resolve dependent styles
    for (var i = 0, il = dependencies.length; i < il; i++) {
      var thisStyle = dependencies[i];

      if (thisStyle instanceof StyleSheetBuilder) {
        thisStyle = thisStyle.getRawStyle();
      } else if (typeof thisStyle === 'function') {
        thisStyle = thisStyle(this.theme, this.platform);
        if (thisStyle instanceof StyleSheetBuilder)
          thisStyle = thisStyle.getRawStyle();
      }

      styles.push(thisStyle);
    }

    return styles;
  }

  getRawStyle() {
    var lut = this.theme.lastUpdateTime();
    if (this._rawStyle && lut <= this._lastRawStyleUpdateTime)
      return this._rawStyle;

    this._lastRawStyleUpdateTime = lut;

    var currentTheme = this.theme.getThemeProperties(),
        mergeStyles = this.resolveDependencies(this._mergeStyles || []),
        nonMergeStyles = this.resolveDependencies(this._resolveStyles || []),
        args = mergeStyles.concat(nonMergeStyles),
        rawStyle = this.sanitizeProps(this.factory(currentTheme, ...args) || {}, this.platform);

    // Now merge all style sheets
    args.push(rawStyle);
    rawStyle = this._rawStyle = D.extend(true, this.styleExports, ...args);

    return rawStyle;
  }

  stripUppercasedFields(style) {
    return D.extend(D.extend.FILTER, (key) => !(key.match(/^[A-Z]/)), {}, style);
  }

  getInternalStyleSheet(_theme) {
    var theme = theme || this.theme,
        lut = theme.lastUpdateTime();

    if (this._style && lut <= this._lastStyleUpdateTime)
      return this._style;

    this._lastStyleUpdateTime = lut;

    var sheetName = this.sheetName,
        rawStyle = this.getRawStyle();

    if (typeof this._onUpdate === 'function')
      rawStyle = this._onUpdate.call(this, rawStyle);

    if (typeof __DEV__ !== 'undefined' && __DEV__ === true)
      this.veryifySanity(sheetName, rawStyle);

    var sheet = this._style = this.createInternalStyleSheet(this.stripUppercasedFields(rawStyle));
    return sheet;
  }

  // This checks for problems with stylesheets (but only in development mode)
  veryifySanity(styleSheetName, obj, _path) {
    var keys = Object.keys(obj),
        path = _path || [];

    for (var i = 0, il = keys.length; i < il; i++) {
      var key = keys[i],
          val = obj[key];

      if (val && val.constructor === Object)
        this.veryifySanity(styleSheetName, val, path.concat(key));
      else if (val !== null && val !== undefined && U.noe(val))
        console.warn('Invalid style property: ' + styleSheetName + ':' + path.concat(key).join('.') + ':' + val);

    }
  }

  getAllPlatforms() {
    return ['android', 'ios', 'microsoft', 'browser'];
  }

  isCurrentPlatform(platform) {
    return (this.platform === platform);
  }

  // Here we sanitize the style... meaning we take the platform styles
  // and either strip them on the non-matching platforms, or override with the correct platform
  sanitizeProps(props, platform) {
    const filterObjectKeys = (_props) => {
      var props = (_props) ? _props : {},
          keys = Object.keys(props),
          platformProps = {},
          normalProps = {},
          platforms = this.getAllPlatforms().reduce((obj, platform) => obj[platform] = obj, {});

      for (var i = 0, il = keys.length; i < il; i++) {
        var key = keys[i],
            value = props[key];

        if (platforms.hasOwnProperty(key))
          platformProps[key] = value;
        else
          normalProps[key] = value;
      }

      return { platformProps, normalProps };
    };

    var { platformProps, normalProps } = filterObjectKeys(props),
        platforms = Object.keys(platformProps);

    for (var i = 0, il = platforms.length; i < il; i++) {
      var platform = platforms[i];
      if (!this.isCurrentPlatform(platform))
        continue;

      Object.assign(normalProps, platformProps[platform] || {});
    }

    return normalProps;
  }

  createInternalStyleSheet(styleObj) {
    return StyleSheetBuilder.createInternalStyleSheet(styleObj);
  }

  flattenInternalStyleSheet(style) {
    return StyleSheetBuilder.flattenInternalStyleSheet(style);
  }
}

module.exports = {
  StyleSheetBuilder,
  createStyleSheet: StyleSheetBuilder.createStyleSheet,
  buildCSSFromStyle: StyleSheetBuilder.buildCSSFromStyle,
  buildCSSFromStyles: StyleSheetBuilder.buildCSSFromStyles
};
