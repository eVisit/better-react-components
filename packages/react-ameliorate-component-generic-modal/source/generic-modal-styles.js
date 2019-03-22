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
    TITLE_BAR_BUTTON_SIZE,
    container: {
      alignItems: 'stretch',
      flexDirection: 'column'
    },
    contentContainer: {
      flex: 0,
      paddingLeft: theme.DEFAULT_PADDING,
      paddingRight: theme.DEFAULT_PADDING
    },
    contentScrollContainer: {
      flexGrow: 1,
      flexShrink: 0,
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'flex-start',
      maxHeight: theme.MAX_DIALOG_CONTENT_HEIGHT
    },
    titleBar: {
      flex: 0,
      flexDirection: 'row',
      alignItems: 'center',
      padding: TITLE_BAR_PADDING,
      browser: {
        userSelect: 'none'
      }
    },
    titleBarTitle: {
      flex: 1
    },
    titleBarTitleText: {
      fontSize: theme.FONT_SIZE_XSMALL,
      color: theme.textColor(theme.contrastColor(theme.MAIN_COLOR), 6)
    },
    closeButtonIcon: {
      fontSize: theme.DEFAULT_BUTTON_ICON_SIZE,
      color: theme.inverseContrastColor(theme.MAIN_COLOR)
    },
    buttonContainer: {
      padding: BUTTON_PADDING,
      alignSelf: 'center',
      alignItems: 'center'
    },
    button: {
      minWidth: 120
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
