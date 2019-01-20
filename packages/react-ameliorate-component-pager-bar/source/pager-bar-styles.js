import { createStyleSheet } from '@react-ameliorate/styles';

export default createStyleSheet(function(theme) {
  const MIN_TAB_SIZE = 30,
        ICON_SIZE = 30;

  return {
    container: {
      flex: 0,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-start'
    },
    tabContainer: {
      flex: 0,
      flexDirection: 'row',
      alignItems: 'stretch',
      justifyContent: 'flex-start',
      paddingLeft: theme.DEFAULT_PADDING * 0.2,
      paddingRight: theme.DEFAULT_PADDING * 0.2,
      browser: {
        cursor: 'pointer'
      }
    },
    tabIconContainer: {
      flex: 0,
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      width: ICON_SIZE,
      height: ICON_SIZE
    },
    tabIcon: {
      fontSize: theme.FONT_SIZE_SMALL,
      color: theme.contrastColor(theme.MAIN_TEXT_COLOR)
    },
    tabCaptionContainer: {
      flex: 0,
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: MIN_TAB_SIZE
    },
    tabCaption: {
      fontSize: theme.FONT_SIZE_SMALL,
      color: theme.contrastColor(theme.MAIN_TEXT_COLOR)
    }
  };
});
