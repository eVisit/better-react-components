import { utils as U }                     from 'evisit-js-utils';
import { buildPalette, Color, ColorConstants } from './colors';

var themeIDCounter = 1;

function getScreenInfo() {
  /* globals _getWindowDimensions */
  if (typeof _getWindowDimensions === 'function')
    return _getWindowDimensions('window');

  var devicePixelRatio = 1,
      width = 1,
      height = 1;

  if (typeof window !== 'undefined' && window) {
    devicePixelRatio = window.devicePixelRatio || 1;
    width = window.innerWidth;
    height = window.innerHeight;
  }

  return {
    width,
    height,
    physicalWidth: width * devicePixelRatio,
    physicalHeight: height * devicePixelRatio,
    scale: devicePixelRatio,
    pixelRatio: 1 / devicePixelRatio
  };
}

// Thanks to "lostsource" from Stack Overflow for the following
// https://stackoverflow.com/questions/13382516/getting-scroll-bar-width-using-javascript
//###if(!MOBILE) {###//
function getScrollbarWidth() {
    var outer = document.createElement("div");
    outer.style.visibility = "hidden";
    outer.style.width = "100px";
    outer.style.msOverflowStyle = "scrollbar"; // needed for WinJS apps

    document.body.appendChild(outer);

    var widthNoScroll = outer.offsetWidth;
    // force scrollbars
    outer.style.overflow = "scroll";

    // add innerdiv
    var inner = document.createElement("div");
    inner.style.width = "100%";
    outer.appendChild(inner);

    var widthWithScroll = inner.offsetWidth;

    // remove divs
    outer.parentNode.removeChild(outer);

    return widthNoScroll - widthWithScroll;
}
//###}###//

export class ThemeProperties {
  static ColorConstants = ColorConstants;
  static Color = Color;

  buildPalette(...args) {
    return buildPalette(...args);
  }

  constructor(themeProps, parentTheme) {
    U.defineROProperty(this, '_theme', parentTheme);

    var paletteProps = this.buildPalette(themeProps, parentTheme && parentTheme.getColorHelperFactory()),
        colorHelpers = paletteProps.colorHelpers,
        keys = Object.keys(colorHelpers);

    for (var i = 0, il = keys.length; i < il; i++) {
      var key = keys[i],
          colorHelper = colorHelpers[key];

      if (typeof colorHelper === 'function') {
        Object.defineProperty(this, key, {
          writable: true,
          enumerable: false,
          configurable: true,
          value: colorHelper.bind(this)
        });
      } else {
        this[key] = colorHelper;
      }
    }

    Object.assign(this, this.getThemeProps(themeProps, paletteProps));
  }

  pixels(count = 1) {
    var screenInfo = (this.getScreenInfo() || {}),
        pixelRatio = screenInfo.pixelRatio || 1;

    return count * pixelRatio;
  }

  getTheme() {
    return this._theme;
  }

  getPlatform() {
    var theme = this.getTheme();
    if (!theme)
      return;

    return theme.getPlatform();
  }

  getScreenInfo() {
    var theme = this.getTheme();
    if (!theme)
      return {};

    return theme.getScreenInfo();
  }

  getThemeProps(themeProps = {}, paletteProps) {
    function safeNumber(number, defaultNumber) {
      return (!number || isNaN(number) || !isFinite(number)) ? defaultNumber : number;
    }

    var finalThemeProps = {},
        theme = this.getTheme();

    if (!theme)
      return {};

    var screenInfo            = this.getScreenInfo(),
        width                 = safeNumber(themeProps.SCREEN_WIDTH, screenInfo.width),
        height                = safeNumber(themeProps.SCREEN_HEIGHT, screenInfo.width),
        IS_MOBILE             = (this.getPlatform() !== 'browser'),
        FONT_SCALAR           = themeProps.FONT_SCALAR || 1,
        SCREEN_WIDTH          = width,
        SCREEN_HEIGHT         = height,
        SCROLLBAR_WIDTH       = 0,
        DEFAULT_PADDING       = 30,
        DEFAULT_INPUT_HEIGHT  = 30,
        DEFAULT_FIELD_HEIGHT  = DEFAULT_INPUT_HEIGHT;

    //###if(!MOBILE) {###//
    SCROLLBAR_WIDTH = getScrollbarWidth();
    //###}###//

    var finalThemeProps = {
      SCROLLBAR_WIDTH,
      SCREEN_WIDTH,
      SCREEN_HEIGHT,
      SCREEN_RATIO: (height) ? (width / height) : 1,
      PLATFORM: this.getPlatform(),
      ONE_PIXEL: screenInfo.pixelRatio,
      IS_MOBILE,
      FONT_LIGHT: {
        fontFamily: (IS_MOBILE) ? 'OpenSans-Light' : 'OpenSans-Light, OpenSans, "Open Sans", sans-serif',
        fontWeight: '200',
      },
      FONT_REGULAR: {
        fontFamily: (IS_MOBILE) ? 'OpenSans-Regular' : 'OpenSans-Regular, OpenSans, "Open Sans", sans-serif',
        fontWeight: '200',
      },
      FONT_SEMIBOLD: {
        fontFamily: (IS_MOBILE) ? 'OpenSans-Semibold' : 'OpenSans-Semibold, OpenSans, "Open Sans", sans-serif',
        fontWeight: '200'
      },
      FONT_SCALAR,
      FONT_WEIGHT_LIGHT: '200',
      FONT_WEIGHT_MEDIUM: '400',
      FONT_WEIGHT_BOLD: '800',

      // Font Size
      FONT_SIZE_XTINY: 10 * FONT_SCALAR,
      FONT_SIZE_TINY: 12 * FONT_SCALAR,
      FONT_SIZE_XSMALL: 14 * FONT_SCALAR,
      FONT_SIZE_SMALL: 16 * FONT_SCALAR,
      FONT_SIZE_XMEDIUM: 18 * FONT_SCALAR,
      FONT_SIZE_MEDIUM: 20 * FONT_SCALAR,
      FONT_SIZE_XHUGE: 24 * FONT_SCALAR,
      FONT_SIZE_HUGE: 32 * FONT_SCALAR,
      FONT_SIZE_XMEGA: 42 * FONT_SCALAR,
      FONT_SIZE_MEGA: 64 * FONT_SCALAR,
      FONT_SIZE_EPIC: 128 * FONT_SCALAR,

      DEFAULT_ANIMATION_DURATION: 300,

      DEFAULT_PADDING,
      DEFAULT_CONTENT_PADDING: DEFAULT_PADDING * 0.25,
      DEFAULT_BORDER_WIDTH: 1,
      DEFAULT_BORDER_RADIUS: 4,
      DEFAULT_BORDER_COLOR: this.fadedColor(this.inverseContrastColor(paletteProps.palette.MAIN_COLOR)),
      DEFAULT_BUTTON_HEIGHT: DEFAULT_INPUT_HEIGHT,
      DEFAULT_INPUT_HEIGHT,
      DEFAULT_FIELD_HEIGHT,
      DEFAULT_HOVER_OPACITY: 0.2,
      DEFAULT_ACTIVE_OPACITY: 0.4,
      MAX_DIALOG_CONTENT_HEIGHT: (IS_MOBILE) ? (SCREEN_HEIGHT * 0.75) : '75vh',

      NO_SELECT: (IS_MOBILE) ? {} : {
        MozUserSelect: 'none',
        WebkitUserSelect: 'none',
        msUserSelect: 'none',
      }
    };

    finalThemeProps.DEFAULT_FONT_SIZE = finalThemeProps.FONT_SIZE_SMALL;
    finalThemeProps.DEFAULT_ICON_SIZE = finalThemeProps.DEFAULT_FONT_SIZE;
    finalThemeProps.DEFAULT_BUTTON_ICON_SIZE = finalThemeProps.DEFAULT_FONT_SIZE;
    finalThemeProps.REM = finalThemeProps.DEFAULT_FONT_SIZE;

    return Object.assign(finalThemeProps, themeProps, paletteProps.palette);
  }
}

export class Theme {
  static getScreenInfo = getScreenInfo;

  constructor(_extraThemeProps, _opts) {
    var opts = Object.assign({}, _opts || {});

    U.defineROProperty(this, '_options', undefined, () => opts);
    U.defineROProperty(this, 'ThemePropertiesClass', undefined, () => this._options.ThemePropertiesClass);
    U.defineROProperty(this, 'platform', undefined, () => opts.platform);

    U.defineRWProperty(this, '_cachedTheme', null);
    U.defineRWProperty(this, '_lastRebuildTime', 0);
    U.defineRWProperty(this, '_themeID', themeIDCounter++);

    this.rebuildTheme(_extraThemeProps);
  }

  getScreenInfo() {
    return getScreenInfo();
  }

  getColorHelperFactory() {
  }

  getPlatform() {
    return this.platform;
  }

  setPlatform(platform) {
    this.platform = platform;
  }

  getThemeID() {
    return this._themeID;
  }

  getThemeProperties() {
    if (!this._cachedTheme)
      this.rebuildTheme();

    return this._cachedTheme;
  }

  lastUpdateTime() {
    return this._lastRebuildTime;
  }

  rebuildTheme(_extraThemeProps = {}, _opts) {
    var opts = _opts || {},
        ThemePropertiesClass = opts.ThemeProperties || this.ThemePropertiesClass || ThemeProperties,
        extraThemeProps = {},
        keys = Object.keys(_extraThemeProps);

    keys.forEach((key) => {
      if (!key.match(/^[A-Z]/))
        return;

      var value = _extraThemeProps[key];
      if (value === undefined)
        return;

      extraThemeProps[key] = value;
    });

    var currentTheme = this._cachedTheme = new ThemePropertiesClass(extraThemeProps, this);
    this._lastRebuildTime = (new Date()).valueOf();

    return currentTheme;
  }
}
