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
      browser: {
        cursor: 'pointer',
        userSelect: 'none'
      }
    },
    internalContainer: {
      borderWidth: theme.DEFAULT_BORDER_WIDTH,
      borderRadius: theme.DEFAULT_BORDER_RADIUS,
      minHeight: theme.DEFAULT_BUTTON_HEIGHT,
      paddingTop: theme.DEFAULT_PADDING * 0.25,
      paddingBottom: theme.DEFAULT_PADDING * 0.25,
      paddingLeft: theme.DEFAULT_PADDING * 0.5,
      paddingRight: theme.DEFAULT_PADDING * 0.5,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center'
    },
    defaultInternalContainer: {
      borderColor: theme.MAIN_COLOR,
      backgroundColor: DEFAULT_BG_COLOR
    },
    defaultInternalContainerHovered: {
      backgroundColor: DEFAULT_HOVER_BG_COLOR
    },
    defaultInternalContainerPressed: {
      backgroundColor: DEFAULT_PRESSED_BG_COLOR
    },
    defaultInternalContainerDisabled: {
      borderColor: theme.GREY03_COLOR,
      backgroundColor: theme.GREY02_COLOR,
      browser: {
        cursor: 'default'
      }
    },
    whiteInternalContainer: {
      borderWidth: theme.DEFAULT_BORDER_WIDTH,
      borderColor: theme.MAIN_COLOR,
      backgroundColor: WHITE_BG_COLOR
    },
    whiteInternalContainerHovered: {
      backgroundColor: WHITE_HOVER_BG_COLOR
    },
    whiteInternalContainerPressed: {
      backgroundColor: WHITE_PRESSED_BG_COLOR
    },
    whiteInternalContainerDisabled: {
      backgroundColor: theme.GREY02_COLOR,
      browser: {
        cursor: 'default'
      }
    },
    caption: {
      fontSize: theme.DEFAULT_FONT_SIZE,
      textAlign: 'center',
      browser: {
        userSelect: 'none'
      }
    },
    defaultCaption: {
      color: theme.textColor(DEFAULT_BG_COLOR)
    },
    defaultCaptionHovered: {
      color: theme.textColor(DEFAULT_HOVER_BG_COLOR)
    },
    defaultCaptionPressed: {
      color: theme.textColor(DEFAULT_PRESSED_BG_COLOR)
    },
    defaultCaptionDisabled: {
      color: theme.textColor(DEFAULT_HOVER_BG_COLOR, 3)
    },
    whiteCaption: {
      color: theme.textColor(WHITE_BG_COLOR, 6, undefined, true)
    },
    whiteCaptionHovered: {
      color: theme.textColor(WHITE_HOVER_BG_COLOR, 6)
    },
    whiteCaptionPressed: {
      color: theme.textColor(WHITE_PRESSED_BG_COLOR, 6)
    },
    whiteCaptionDisabled: {
      color: theme.textColor(WHITE_PRESSED_BG_COLOR, 6)
    },
    icon: {
      fontSize: theme.DEFAULT_BUTTON_ICON_SIZE,
      textAlign: 'center',
      browser: {
        userSelect: 'none'
      }
    },
    defaultIcon: {
      color: theme.textColor(DEFAULT_BG_COLOR)
    },
    defaultIconHovered: {
      color: theme.textColor(DEFAULT_HOVER_BG_COLOR)
    },
    defaultIconPressed: {
      color: theme.textColor(DEFAULT_PRESSED_BG_COLOR)
    },
    defaultIconDisabled: {
      color: theme.textColor(DEFAULT_HOVER_BG_COLOR, 3)
    },
    whiteIcon: {
      color: theme.textColor(WHITE_BG_COLOR, 6, undefined, true)
    },
    whiteIconHovered: {
      color: theme.textColor(WHITE_HOVER_BG_COLOR, 6)
    },
    whiteIconPressed: {
      color: theme.textColor(WHITE_PRESSED_BG_COLOR, 6)
    },
    whiteIconDisabled: {
      color: theme.textColor(WHITE_PRESSED_BG_COLOR, 6)
    },
    iconContainer: {
    },
    leftIconContainer: {
      paddingRight: theme.DEFAULT_PADDING * 0.25
    },
    rightIconContainer: {
      paddingLeft: theme.DEFAULT_PADDING * 0.25
    }
  };
});
