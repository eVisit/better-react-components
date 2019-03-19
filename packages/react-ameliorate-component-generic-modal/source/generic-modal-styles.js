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
      flex: 0
    },
    contentScrollContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingLeft: CONTENT_PADDING,
      paddingRight: CONTENT_PADDING,
      paddingBottom: CONTENT_PADDING,
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
      color: theme.textColor(theme.contrastColor(theme.MAIN_COLOR), 7)
    },
    closeButton: {
      width: TITLE_BAR_BUTTON_SIZE,
      height: TITLE_BAR_BUTTON_SIZE,
      borderWidth: 0
    },
    closeButtonIcon: {
      color: theme.inverseContrastColor(theme.MAIN_COLOR)
    },
    buttonContainer: {
      padding: BUTTON_PADDING,
      alignSelf: 'center',
      alignItems: 'center'
    },
    button: {
      minWidth: 120
    }
  };
}, {
  mergeStyles: modalStyles
});
