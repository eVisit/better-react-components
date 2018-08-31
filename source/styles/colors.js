import Color from 'color';

const ERROR_COLOR = {
        "h": 355.531914893617,
        "s": 83.92857142857143,
        "l": 56.07843137254902
      },
      ISSUE_COLOR = {
        "h": 25.555555555555543,
        "s": 68.0672268907563,
        "l": 53.333333333333336
      },
      SUCCESS_COLOR = {
        "h": 150,
        "s": 46.15384615384615,
        "l": 54.11764705882353
      },
      PALETTE1_COLOR = {
        "h": 33.438735177865624,
        "s": 100,
        "l": 49.6078431372549
      },
      PALETTE2_COLOR = {
        "h": 43.80530973451329,
        "s": 96.58119658119656,
        "l": 45.88235294117647
      },
      PALETTE3_COLOR = {
        "h": 48.81355932203388,
        "s": 95.9349593495935,
        "l": 51.764705882352935
      },
      PALETTE4_COLOR = {
        "h": 50.35294117647061,
        "s": 100,
        "l": 50
      },
      PALETTE5_COLOR = {
        "h": 144.3529411764706,
        "s": 67.46031746031747,
        "l": 50.588235294117645
      },
      PALETTE6_COLOR = {
        "h": 150,
        "s": 46.15384615384615,
        "l": 54.11764705882353
      },
      PALETTE7_COLOR = {
        "h": 160.30303030303025,
        "s": 83.89830508474577,
        "l": 53.72549019607843
      },
      PALETTE8_COLOR = {
        "h": 197.39999999999998,
        "s": 50.000000000000014,
        "l": 60.7843137254902
      },
      PALETTE9_COLOR = {
        "h": 267.3529411764706,
        "s": 82.92682926829268,
        "l": 67.84313725490196
      },
      PALETTE10_COLOR = {
        "h": 303.6923076923076,
        "s": 46.09929078014185,
        "l": 72.35294117647058
      },
      PALETTE11_COLOR = {
        "h": 309.2307692307693,
        "s": 84.5528455284553,
        "l": 51.76470588235295
      },
      PALETTE12_COLOR = {
        "h": 355.531914893617,
        "s": 83.92857142857143,
        "l": 56.07843137254902
      },
      BLACK_COLOR = {
        "h": 0,
        "s": 100,
        "l": 100
      },
      WHITE_COLOR = {
        "h": 0,
        "s": 100,
        "l": 100
      };

const DEFAULT_MAIN_COLOR = { h: 207, s: 90, l: 54 },
      DEFAULT_ALT1_SATURATION_RATIO = 0.76,
      DEFAULT_ALT1_LUMINOSITY_RATIO = 1,
      DEFAULT_ALT1_LUMINOSITY_MIN_OFFSET = DEFAULT_MAIN_COLOR.l - (DEFAULT_MAIN_COLOR.l * DEFAULT_ALT1_LUMINOSITY_RATIO),
      DEFAULT_ALT2_SATURATION_RATIO = 0.66,
      DEFAULT_ALT2_LUMINOSITY_RATIO = 0.747,
      DEFAULT_ALT2_LUMINOSITY_MIN_OFFSET = DEFAULT_MAIN_COLOR.l - (DEFAULT_MAIN_COLOR.l * DEFAULT_ALT2_LUMINOSITY_RATIO),
      DEFAULT_ACCEPTABLE_TEXT_CONTRAST_RATIO = (8 / 21),
      DEFAULT_TRANSPARENCY_RATIO = 0.2,
      DEFAULT_FADE_RATIO = 0.05;

function rebuildPallette(opts = {}, _colorHelperFactory) {
  function getAlt1Color({ h, s, l }) {
    var altL = l - alt1LuminosityOffset;
    if (altL < 0)
      altL = l + alt1LuminosityOffset;

    return {
      h,
      s: s * alt1SaturationRatio,
      l: altL
    };
  }

  function getAlt2Color({ h, s, l }) {
    var altL = l - alt2LuminosityOffset;
    if (altL < 0)
      altL = l + alt2LuminosityOffset;

    return {
      h,
      s: s * alt2SaturationRatio,
      l: altL
    };
  }

  function addToPallette(obj, name, color, alpha) {
    var key = (`${name}_COLOR`).toUpperCase();

    if (alpha)
      obj[key] = `hsla(${color.h},${color.s}%,${color.l}%,${alpha})`;
    else
      obj[key] = `hsl(${color.h},${color.s}%,${color.l}%)`;
  }

  var options = Object.assign({},
      {
        MAIN_COLOR: DEFAULT_MAIN_COLOR,
        ALT1_SATURATION_RATIO: DEFAULT_ALT1_SATURATION_RATIO,
        ALT1_LUMINOSITY_RATIO: DEFAULT_ALT1_LUMINOSITY_RATIO,
        ALT2_SATURATION_RATIO: DEFAULT_ALT2_SATURATION_RATIO,
        ALT2_LUMINOSITY_RATIO: DEFAULT_ALT2_LUMINOSITY_RATIO,
        ACCEPTABLE_TEXT_CONTRAST_RATIO: DEFAULT_ACCEPTABLE_TEXT_CONTRAST_RATIO,
        TRANSPARENCY_RATIO: DEFAULT_TRANSPARENCY_RATIO,
        FADE_RATIO: DEFAULT_FADE_RATIO
      }, (opts || {})),
      // default properties
      mainColor             = options.MAIN_COLOR,
      alt1SaturationRatio   = options.ALT1_SATURATION_RATIO,
      alt1LuminosityRatio   = options.ALT1_LUMINOSITY_RATIO,
      alt1LuminosityOffset  = options.ALT1_LUMINOSITY_OFFSET,
      alt2SaturationRatio   = options.ALT2_SATURATION_RATIO,
      alt2LuminosityRatio   = options.ALT2_LUMINOSITY_RATIO,
      alt2LuminosityOffset  = options.ALT2_LUMINOSITY_OFFSET,
      textContrastRatio     = options.ACCEPTABLE_TEXT_CONTRAST_RATIO,
      transparencyRatio     = options.TRANSPARENCY_RATIO,
      fadeRatio             = options.FADE_RATIO,
      thisMainColor         = Color(mainColor).hsl().object();

  if (alt1LuminosityOffset == null)
    alt1LuminosityOffset = thisMainColor.l - (thisMainColor.l * alt1LuminosityRatio);

  if (alt2LuminosityOffset == null)
    alt2LuminosityOffset = thisMainColor.l - (thisMainColor.l * alt2LuminosityRatio);

  var pallette = {},
      colorTable = Object.assign({
        MAIN: thisMainColor,
        ALT1: getAlt1Color(thisMainColor),
        ALT2: getAlt2Color(thisMainColor),
        ERROR: ERROR_COLOR,
        ISSUE: ISSUE_COLOR,
        SUCCESS: SUCCESS_COLOR,
        PALETTE1: Object.assign({}, PALETTE1_COLOR, { textColor: WHITE_COLOR }),
        PALETTE2: Object.assign({}, PALETTE2_COLOR, { textColor: WHITE_COLOR }),
        PALETTE3: Object.assign({}, PALETTE3_COLOR, { textColor: WHITE_COLOR }),
        PALETTE4: Object.assign({}, PALETTE4_COLOR, { textColor: WHITE_COLOR }),
        PALETTE5: Object.assign({}, PALETTE5_COLOR, { textColor: WHITE_COLOR }),
        PALETTE6: Object.assign({}, PALETTE6_COLOR, { textColor: WHITE_COLOR }),
        PALETTE7: Object.assign({}, PALETTE7_COLOR, { textColor: WHITE_COLOR }),
        PALETTE8: Object.assign({}, PALETTE8_COLOR, { textColor: WHITE_COLOR }),
        PALETTE9: Object.assign({}, PALETTE9_COLOR, { textColor: WHITE_COLOR }),
        PALETTE10: Object.assign({}, PALETTE10_COLOR, { textColor: WHITE_COLOR }),
        PALETTE11: Object.assign({}, PALETTE11_COLOR, { textColor: WHITE_COLOR }),
        PALETTE12: Object.assign({}, PALETTE12_COLOR, { textColor: WHITE_COLOR }),
        BLACK: Object.assign({}, WHITE_COLOR, { textColor: WHITE_COLOR }),
        WHITE: Object.assign({}, WHITE_COLOR, { textColor: BLACK_COLOR })
      }, (options.PALETTE || {})),
      colorKeys = Object.keys(colorTable),
      palletteKeys = colorKeys.filter((key) => !!key.match(/^PALETTE/));

  // Color helper functions
  const colorHelperFactory = (typeof _colorHelperFactory === 'function') ? _colorHelperFactory : ((cb) => cb);
  const colorToHSL = colorHelperFactory(function colorToHSL(color, alpha = 1.0) {
    var [ h, s, l ] = color.hsl().color;
    return `hsla(${h},${s}%,${l}%,${alpha})`;
  });

  function clamp(number, min, max) {
    return Math.min(Math.max(number, min), max);
  }

  const getRelativeColorLuminance = colorHelperFactory(function getRelativeColorLuminance(color) {
    var contrast = color.contrast(Color('black'));
    return (contrast - 1) / 20;
  });

  const getContrastColorHSL = colorHelperFactory(function getContrastColorHSL(_color, acceptableContrastRatio = textContrastRatio) {
    var color = new Color(_color),
        relativeLuminance = getRelativeColorLuminance(color),
        [ h, s ] = color.hsl().color,
        contrastColor = { h: (h + 180) % 360, s: s, l: (relativeLuminance < acceptableContrastRatio) ? 100 : 0, alpha: color.alpha() };

    return contrastColor;
  });

  const blendColors = colorHelperFactory(function blendColors(topColor, bottomColor, _blendFunc) {
    function defaultBlendFunc(color1, color2, channel, value) {
      function blendChannelsWithAlpha(c1, c2, alpha) {
        var range = c2 - c1;
        return clamp(Math.round((c1 + (range * alpha)) * 255), 0, 255);
      }

      var alpha = color2.alpha,
          keys = ['r', 'g', 'b'],
          blendedColor = { alpha: 1 };

      for (var i = 0, il = keys.length; i < il; i++) {
        var key = keys[i];
        blendedColor[key] = blendChannelsWithAlpha(color1[key], color2[key], alpha);
      }

      return blendedColor;
    }

    function getBlendedColor(color1, color2) {
      if (!color1.hasOwnProperty('alpha'))
        color1.alpha = 1;

      if (!color2.hasOwnProperty('alpha'))
        color2.alpha = 1;

      color1.a = color1.alpha;
      color2.a = color2.alpha;

      var blendedColor = blendFunc(color1, color2);
      return new Color(blendedColor);
    }

    var blendFunc = _blendFunc || defaultBlendFunc,
        blendedColor = getBlendedColor((new Color(topColor)).unitObject(), (new Color(bottomColor)).unitObject());

    return colorToHSL(blendedColor);
  });

  const transparentColor = colorHelperFactory(function transparentColor(color, alpha = transparencyRatio) {
    return colorToHSL(new Color(color), alpha);
  });

  const fadedColor = colorHelperFactory(function fadedColor(color, alpha = fadeRatio) {
    return transparentColor(color, alpha);
  });

  const opaqueColor = colorHelperFactory(function opaqueColor(color) {
    return transparentColor(color, 1.0);
  });

  const contrastColor = colorHelperFactory(function contrastColor(_color, acceptableContrastRatio) {
    var contrastColor = getContrastColorHSL(_color, acceptableContrastRatio);
    return `hsla(${contrastColor.h},${contrastColor.s}%,${contrastColor.l}%,${contrastColor.alpha})`;
  });

  const inverseContrastColor = colorHelperFactory(function inverseContrastColor(_color, acceptableContrastRatio) {
    var contrastColor = getContrastColorHSL(_color, acceptableContrastRatio),
        invContrastColor = { h: contrastColor.h, s: contrastColor.s, l: 100 - contrastColor.l };

    return `hsla(${invContrastColor.h},${invContrastColor.s}%,${invContrastColor.l}%,${contrastColor.alpha})`;
  });

  const textColor = colorHelperFactory(function textColor(color, acceptableContrastRatio) {
    return contrastColor(color, acceptableContrastRatio);
  });

  const getColorNameFromStrings = colorHelperFactory(function getColorNameFromStrings(...args) {
    var finalNumber = (args.length) ? args.reduce((sum, item) => {
          return (!item) ? 0 : ('' + item).charCodeAt(0);
        }) : 0;

    return `${palletteKeys[(finalNumber % palletteKeys.length)]}_COLOR`;
  });

  const getColorContrastRatio = colorHelperFactory(function(c1, c2) {
    var a = (new Color(c1).hsl().colors[2]),
        b = (new Color(c2).hsl().colors[2]);

    return (Math.max(a, b) + 0.01) / (Math.min(a, b) + 0.01);
  });

  for (var i = 0, il = colorKeys.length; i < il; i++) {
    var colorKey = colorKeys[i],
        color = colorTable[colorKey],
        relativeLuminance = getRelativeColorLuminance(new Color({ h: color.h, s: color.s, l: color.l })),
        thisContrastColor = { h: (color.h + 180) % 360, s: color.s, l: (relativeLuminance < textContrastRatio) ? 100 : 0 };

    // color
    addToPallette(pallette, colorKey, color);

    // text color
    addToPallette(pallette, `${colorKey}_TEXT`, (color.textColor) ? color.textColor : thisContrastColor);
  }

  return {
    colorHelpers: {
      clamp,
      blendColors,
      transparentColor,
      opaqueColor,
      fadedColor,
      textColor,
      contrastColor,
      inverseContrastColor,
      getColorNameFromStrings,
      getColorContrastRatio
    },
    pallette
  };
}

const Constants = {
  DEFAULT_MAIN_COLOR,
  DEFAULT_ALT1_SATURATION_RATIO,
  DEFAULT_ALT1_LUMINOSITY_RATIO,
  DEFAULT_ALT1_LUMINOSITY_MIN_OFFSET,
  DEFAULT_ALT2_SATURATION_RATIO,
  DEFAULT_ALT2_LUMINOSITY_RATIO,
  DEFAULT_ALT2_LUMINOSITY_MIN_OFFSET,
  DEFAULT_ACCEPTABLE_TEXT_CONTRAST_RATIO,
  DEFAULT_TRANSPARENCY_RATIO,
  DEFAULT_FADE_RATIO
};

export {
  Color,
  rebuildPallette,
  Constants
};
