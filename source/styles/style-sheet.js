/* globals __DEV__ */

import { utils as U, data as D } from 'evisit-js-utils';

var styleSheetID = 1;

export class StyleSheetBuilder {
  constructor({ thisSheetID, styleExports, sheetName, theme, platform, factory, mergeStyles, resolveStyles, onUpdate }) {
    if (!(factory instanceof Function))
      throw new Error('Theme factory must be a function');

    U.defineROProperty(this, 'styleExports', styleExports);
    U.defineROProperty(this, 'sheetName', sheetName);
    U.defineROProperty(this, 'theme', theme);
    U.defineROProperty(this, 'factory', factory);
    U.defineROProperty(this, '_styleSheetID', thisSheetID);
    U.defineROProperty(this, '_mergeStyles', (mergeStyles instanceof Array) ? mergeStyles : [mergeStyles]);
    U.defineROProperty(this, '_resolveStyles', (resolveStyles) ? resolveStyles : [resolveStyles]);
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

  static flattenInternalStyleSheet(style, _finalStyle) {
    var finalStyle = _finalStyle || {};
    if (!(style instanceof Array))
      return Object.assign(finalStyle, (style || {}));

    for (var i = 0, il = style.length; i < il; i++) {
      var thisStyle = style[i];
      if (!thisStyle)
        continue;

      if (thisStyle instanceof Array)
        finalStyle = StyleSheetBuilder.flattenInternalStyleSheet(thisStyle, finalStyle);
      else
        finalStyle = Object.assign(finalStyle, (thisStyle || {}));
    }

    if (finalStyle.flex === 0)
      finalStyle.flex = 'none';

    return finalStyle;
  }

  static getStyleSheet(props) {
    return new StyleSheetBuilder(props);
  }

  static createStyleSheet(factory, props = {}) {
    function styleSheetName(name) {
      var error = new Error('___TAG___'),
          lines = ('' + error.stack).split(/^\s+at\s+/gm),
          callingFunction = lines[3];

      if (callingFunction == null)
        return `<unknown:${thisSheetID}>`;

      return callingFunction.replace(/^[^(]+\(/, '').replace(/\)[^)]+$/, '');
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

    Object.defineProperty(styleFunction, '_styleSheetName', {
      writable: false,
      enumerable: false,
      configurable: false,
      value: sheetName
    });

    Object.defineProperty(styleFunction, '_styleSheetID', {
      writable: false,
      enumerable: false,
      configurable: false,
      value: thisSheetID
    });

    return styleFunction;
  }

  static getCSSRuleName(key) {
    if (key === 'textDecorationLine')
      return 'text-decoration';

    return key.replace(/[A-Z]/g, function(m) {
      return '-' + (m.toLowerCase());
    });
  }

  static getCSSRuleValue(ruleName, ruleValue, key) {
    if (ruleName === 'text-decoration')
      return ruleValue;

    if (ruleName === 'transform') {
      var axis = ['translateX', 'translateY', 'rotate', 'scaleX', 'scaleY'],
          transformParts = [];

      for (var i = 0, il = axis.length; i < il; i++) {
        var currentAxis = axis[i],
            axisVal = ruleValue[currentAxis];

        if (axisVal !== null && axisVal !== undefined)
          transformParts.push(currentAxis + '(' + axisVal + 'px)');
      }

      return transformParts.join(' ');
    }

    if (ruleName === 'opacity')
      return ('' + ruleValue);

    if ((ruleValue instanceof Number) || typeof ruleValue === 'number')
      return ruleValue + 'px';

    return ruleValue;
  }

  static buildCSSFromStyle(style, selector) {
    if (!style) {
      console.warn('Warning: The specified style is empty. Ignoring.');
      return;
    }

    if (!selector) {
      console.warn('Warning: The specified selector is empty. Ignoring.');
      return;
    }

    var flatStyle = StyleSheetBuilder.flattenInternalStyleSheet(style),
        cssStyle = [selector, '{'],
        keys = Object.keys(flatStyle);

    for (var i = 0, il = keys.length; i < il; i++) {
      var key = keys[i],
          ruleName = StyleSheetBuilder.getCSSRuleName(key),
          ruleValue = StyleSheetBuilder.getCSSRuleValue(ruleName, flatStyle[key], key);

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

  getCSSRuleName(...args) {
    return StyleSheetBuilder.getCSSRuleName(...args);
  }

  getCSSRuleValue(...args) {
    return StyleSheetBuilder.getCSSRuleValue(...args);
  }

  buildCSSFromStyle(...args) {
    return StyleSheetBuilder.getCSSRuleValue(...args);
  }

  buildCSSFromStyles(...args) {
    return StyleSheetBuilder.getCSSRuleValue(...args);
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

        if (style instanceof Array)
          resolveAllStyles.call(this, style, finalStyles);
        else if (style)
          finalStyles.push(style);
      }
    }

    var sheet = this.getInternalStyleSheet(),
        mergedStyles = [];

    resolveAllStyles.call(this, args, mergedStyles);

    if (mergedStyles.length < 2)
      return mergedStyles[0];

    return this.flattenInternalStyleSheet(mergedStyles);
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
      if (thisStyle == null)
        continue;

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

  invokeFactoryCallback(theme, args) {
    if (typeof this.factory !== 'function')
      return {};

    return (this.factory(theme, ...args) || {});
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
        rawStyle = this.sanitizeProps(this.invokeFactoryCallback(currentTheme, args), this.platform);

    // Now merge all style sheets
    args.push(rawStyle);
    rawStyle = this._rawStyle = D.extend(true, this.styleExports, ...args);

    return rawStyle;
  }

  stripUppercasedFields(style) {
    return D.extend(D.extend.FILTER, (key) => !(key.match(/^[A-Z]/)), {}, style);
  }

  getInternalStyleSheet(_theme) {
    var theme = _theme || this.theme,
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

      if (val != null && U.noe(val))
        console.warn('Invalid style property: ' + styleSheetName + ':' + path.concat(key).join('.') + ':' + ((val && U.instanceOf(val, 'object', 'array')) ? JSON.stringify(val) : val));
      else if (val && U.instanceOf(val, 'object'))
        this.veryifySanity(styleSheetName, val, path.concat(key));
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
  sanitizeProps(props, platform, alreadyVisited = []) {
    const filterObjectKeys = (_props) => {
      var props = (_props) ? _props : {},
          keys = Object.keys(props),
          platformProps = {},
          normalProps = {},
          platforms = this.getAllPlatforms().reduce((obj, platform) => obj[platform] = obj, {});

      alreadyVisited.push(props);

      for (var i = 0, il = keys.length; i < il; i++) {
        var key = keys[i],
            value = props[key];

        if (platforms.hasOwnProperty(key)) {
          platformProps[key] = value;
        } else {
          if (value && U.instanceOf(value, 'object') && alreadyVisited.indexOf(value) < 0)
            normalProps[key] = this.sanitizeProps(value, platform, alreadyVisited);
          else
            normalProps[key] = value;
        }
      }

      return { platformProps, normalProps };
    };

    var { platformProps, normalProps } = filterObjectKeys(props),
        platforms = Object.keys(platformProps);

    for (var i = 0, il = platforms.length; i < il; i++) {
      var thisPlatform = platforms[i];
      if (!this.isCurrentPlatform(thisPlatform))
        continue;

      Object.assign(normalProps, platformProps[thisPlatform] || {});
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

const createStyleSheet = StyleSheetBuilder.createStyleSheet,
      buildCSSFromStyle = StyleSheetBuilder.buildCSSFromStyle,
      buildCSSFromStyles = StyleSheetBuilder.buildCSSFromStyles;

export {
  createStyleSheet,
  buildCSSFromStyle,
  buildCSSFromStyles
};
