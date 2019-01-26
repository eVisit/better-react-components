import { createStyleSheet } from '@react-ameliorate/styles';

export default createStyleSheet(function(theme) {
  const DEFAULT_BG_COLOR          = theme.MAIN_COLOR,
        DEFAULT_HOVER_BG_COLOR    = theme.blendColors(theme.contrastColor(theme.MAIN_COLOR), theme.transparentColor(theme.MAIN_COLOR, 1 - theme.DEFAULT_HOVER_OPACITY)),
        DEFAULT_PRESSED_BG_COLOR  = theme.blendColors(theme.contrastColor(theme.MAIN_COLOR), theme.transparentColor(theme.MAIN_COLOR, theme.DEFAULT_HOVER_OPACITY)),
        WHITE_BG_COLOR            = theme.contrastColor(theme.MAIN_COLOR),
        WHITE_HOVER_BG_COLOR      = theme.blendColors(theme.contrastColor(theme.MAIN_COLOR), theme.transparentColor(theme.MAIN_COLOR, theme.DEFAULT_HOVER_OPACITY)),
        WHITE_PRESSED_BG_COLOR    = theme.blendColors(theme.contrastColor(theme.MAIN_COLOR), theme.transparentColor(theme.MAIN_COLOR, 1 - theme.DEFAULT_HOVER_OPACITY));

  return {
    container: {
      flex: 0,
      flexDirection: 'column',
      alignItems: 'stretch',
      justifyContent: 'center',
      borderRadius: theme.DEFAULT_RADIUS,
      browser: {
        cursor: 'pointer',
        userSelect: 'none'
      }
    },
    defaultContainer: {
      borderWidth: 1,
      borderColor: theme.MAIN_COLOR,
      backgroundColor: DEFAULT_BG_COLOR
    },
    defaultContainerHovered: {
      backgroundColor: DEFAULT_HOVER_BG_COLOR
    },
    defaultPressedContainer: {
      backgroundColor: DEFAULT_PRESSED_BG_COLOR
    },
    defaultContainerDisabled: {
      backgroundColor: theme.GREY02_COLOR
    },
    whiteContainer: {
      borderWidth: 1,
      borderColor: theme.MAIN_COLOR,
      backgroundColor: WHITE_BG_COLOR
    },
    whiteContainerHovered: {
      backgroundColor: WHITE_HOVER_BG_COLOR
    },
    whitePressedContainer: {
      backgroundColor: WHITE_PRESSED_BG_COLOR
    },
    whiteContainerDisabled: {
      backgroundColor: theme.GREY02_COLOR
    },
    internalContainer: {
      minHeight: theme.DEFAULT_INPUT_HEIGHT - 2,
      padding: theme.DEFAULT_PADDING * 0.3,
      alignItems: 'center',
      justifyContent: 'center'
    },
    caption: {
      fontSize: theme.DEFAULT_FONT_SIZE,
      textAlign: 'center',
      userSelect: 'none'
    },
    defaultCaption: {
      color: theme.textColor(DEFAULT_BG_COLOR)
    },
    defaultCaptionHovered: {
      color: theme.textColor(DEFAULT_HOVER_BG_COLOR)
    },
    defaultPressedCaption: {
      color: theme.textColor(DEFAULT_PRESSED_BG_COLOR)
    },
    defaultCaptionDisabled: {
      color: theme.textColor(DEFAULT_HOVER_BG_COLOR, 6)
    },
    whiteCaption: {
      color: theme.textColor(WHITE_BG_COLOR, 7)
    },
    whiteCaptionHovered: {
      color: theme.textColor(WHITE_HOVER_BG_COLOR, 7)
    },
    whitePressedCaption: {
      color: theme.textColor(WHITE_PRESSED_BG_COLOR, 7)
    },
    whiteCaptionDisabled: {
      color: theme.textColor(WHITE_PRESSED_BG_COLOR, 6)
    },
  };
});
