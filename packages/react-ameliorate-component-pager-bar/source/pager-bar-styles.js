import { createStyleSheet } from '@react-ameliorate/styles';

export default createStyleSheet(function(theme) {
  const DEFAULT_ACTIVE_TAB_BG_COLOR = theme.blendColors(theme.contrastColor(theme.MAIN_COLOR), theme.transparentColor(theme.MAIN_COLOR, 1 - theme.DEFAULT_HOVER_OPACITY));

  return {
    DEFAULT_ACTIVE_TAB_BG_COLOR,
    container: {
      flex: 0,
      flexDirection: 'row',
      alignItems: 'stretch',
      justifyContent: 'flex-start'
    },
    horizontalContainer: {
      flexDirection: 'row'
    },
    verticalContainer: {
      flexDirection: 'column'
    },
    buttonContainer: {
      flex: 0,
      browser: {
        cursor: 'pointer'
      },
      alignItems: 'stretch',
      justifyContent: 'center'
    },
    horizontalButtonContainer: {
      flexDirection: 'row'
    },
    verticalButtonContainer: {
      flexDirection: 'column'
    },
    tabButton: {
      flex: 0,
      padding: theme.DEFAULT_PADDING * 0.2,
      textAlign: 'center',
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 0,
      borderRadius: 0
    },
    tabButtonActive: {
      backgroundColor: DEFAULT_ACTIVE_TAB_BG_COLOR
    },
    horizontalTabButton: {
      flexDirection: 'row'
    },
    verticalTabButton: {
      flexDirection: 'column'
    },
    tabIconContainer: {
      flex: 0,
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center'
    },
    tabIcon: {
      fontSize: theme.FONT_SIZE_SMALL,
      color: theme.contrastColor(theme.MAIN_TEXT_COLOR)
    },
    tabCaptionContainer: {
      flex: 0,
      alignItems: 'center',
      justifyContent: 'center'
    },
    horizontalTabCaptionContainer: {
      paddingLeft: theme.DEFAULT_PADDING * 0.2,
    },
    verticalTabCaptionContainer: {
      paddingTop: theme.DEFAULT_PADDING * 0.2,
    },
    tabCaption: {
      fontSize: theme.FONT_SIZE_SMALL,
      color: theme.contrastColor(theme.MAIN_TEXT_COLOR)
    }
  };
});
