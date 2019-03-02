import { createStyleSheet } from '@react-ameliorate/styles';

export default createStyleSheet(function(theme) {
  return {
    container: {
      flex: 0,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center'
    },
    icon: {
      fontSize: theme.DEFAULT_ICON_SIZE,
      color: theme.MAIN_COLOR,
      backgroundColor: 'transparent',
      textAlign: 'center',
      browser: {
        WebkitFontSmoothing: 'auto'
      }
    }
  };
});
