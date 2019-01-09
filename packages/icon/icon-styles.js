import { createStyleSheet } from '@base';

export default createStyleSheet(function(theme) {
  return {
    container: {
      flex: 0,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center'
    },
    icon: {
      fontFamily: 'propria',
      fontSize: theme.FONT_SIZE_SMALL,
      color: theme.MAIN_COLOR,
      backgroundColor: 'transparent',
      textAlign: 'center',
      marginTop: '-0.1em'
    }
  };
});
