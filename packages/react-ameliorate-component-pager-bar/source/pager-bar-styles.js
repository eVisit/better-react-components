import { createStyleSheet } from '@react-ameliorate/styles';

export default createStyleSheet(function(theme) {
  const DEFAULT_ACTIVE_TAB_BG_COLOR = theme.blendColors(theme.contrastColor(theme.MAIN_COLOR), theme.transparentColor(theme.MAIN_COLOR, 1 - theme.DEFAULT_HOVER_OPACITY));

  return {
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
    tabTouchableContainer: {
      flex: 0,
      browser: {
        cursor: 'pointer'
      },
      alignItems: 'stretch',
      justifyContent: 'center'
    },
    horizontalTabTouchableContainer: {
      flexDirection: 'row'
    },
    verticalTabTouchableContainer: {
      flexDirection: 'column'
    },
    tabContainer: {
      flex: 0,
      paddingLeft: theme.DEFAULT_PADDING * 0.2,
      paddingRight: theme.DEFAULT_PADDING * 0.2,
      textAlign: 'center',
      alignItems: 'center',
      justifyContent: 'center'
    },
    tabContainerActive: {
      backgroundColor: DEFAULT_ACTIVE_TAB_BG_COLOR
    },
    horizontalTabContainer: {
      flexDirection: 'row'
    },
    verticalTabContainer: {
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
    tabCaption: {
      fontSize: theme.FONT_SIZE_SMALL,
      color: theme.contrastColor(theme.MAIN_TEXT_COLOR)
    }
  };
});
