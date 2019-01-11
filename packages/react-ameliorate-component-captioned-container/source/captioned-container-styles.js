import { createStyleSheet } from '@base';

export default createStyleSheet(function(theme) {
  return {
    container: {
      flex: 1,
      flexDirection: 'column',
      alignItems: 'stretch'
    },
    captionContainer: {
      flex: 0,
      paddingBottom: theme.DEFAULT_PADDING * 0.25
    },
    caption: {
      fontSize: theme.FONT_SIZE_SMALL
    },
    contentContainer: {
      flex: 1
    }
  };
});
