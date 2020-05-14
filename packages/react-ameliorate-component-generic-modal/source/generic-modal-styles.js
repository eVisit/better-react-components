import { createStyleSheet } from '@react-ameliorate/styles';
import { modalStyles }      from '@react-ameliorate/component-modal';

export default createStyleSheet(function(theme) {
  const TITLE_BAR_PADDING     = Math.round(theme.DEFAULT_PADDING * 0.25),
        CONTENT_PADDING       = Math.round(theme.DEFAULT_PADDING * 0.25),
        BUTTON_PADDING        = Math.round(theme.DEFAULT_PADDING * 0.25),
        TITLE_BAR_BUTTON_SIZE = 30;

  return {
    TITLE_BAR_PADDING,
    BUTTON_PADDING,
    CONTENT_PADDING,
    TITLE_BAR_BUTTON_SIZE,
    container: {
      alignItems: 'stretch'
    },
    contentContainer: {
      flex: 0,
      paddingLeft: theme.DEFAULT_PADDING,
      paddingRight: theme.DEFAULT_PADDING
    },
    contentScrollView: {
      flex: 0,
      flexGrow: 0,
      flexShrink: 1
    },
    contentScrollContainer: {
      flex: 0,
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'flex-start',
      maxHeight: theme.MAX_DIALOG_CONTENT_HEIGHT
    },
    titleBar: {
      flex: 0,
      minHeight: (TITLE_BAR_PADDING * 2) + theme.FONT_SIZE_XSMALL,
      flexDirection: 'row',
      alignItems: 'center',
      padding: TITLE_BAR_PADDING,
      browser: {
        userSelect: 'none'
      }
    },
    titleBarTitle: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center'
    },
    titleBarTitleText: {
      fontSize: theme.FONT_SIZE_XSMALL,
      color: theme.textColor(theme.contrastColor(theme.MAIN_COLOR), 6)
    },
    titleBarTitleIcon: {
      fontSize: theme.FONT_SIZE_XSMALL,
      color: theme.textColor(theme.contrastColor(theme.MAIN_COLOR), 6)
    },
    titleBarTitleIconContainer: {
      paddingRight: theme.DEFAULT_PADDING * 0.5
    },
    closeButtonIcon: {
      fontSize: theme.DEFAULT_BUTTON_ICON_SIZE,
      color: theme.inverseContrastColor(theme.MAIN_COLOR)
    },
    buttonGroupContainer: {
      flex: 0,
      padding: BUTTON_PADDING,
      flexDirection: 'column',
      alignItems: 'stretch',
      justifyContent: 'flex-start'
    },
    buttonContainer: {
      flex: 0,
      alignItems: 'center',
      justifyContent: 'center'
    },
    button: {
      minWidth: (theme.IS_MOBILE) ? 40 : 120
    },
    closeButtonInternalContainer: {
      minWidth: null,
      minHeight: null,
      borderWidth: 0,
      borderRadius: 0,
      width: TITLE_BAR_BUTTON_SIZE,
      height: TITLE_BAR_BUTTON_SIZE,
      padding: 0
    }
  };
}, {
  mergeStyles: modalStyles
});
