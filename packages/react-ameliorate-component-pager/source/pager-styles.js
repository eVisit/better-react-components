import { createStyleSheet } from '@base';

export default createStyleSheet(function(theme) {
  const MIN_TAB_SIZE = 30,
        ICON_SIZE = 30;

  return {
    container: {
      flex: 1,
      flexDirection: 'column',
      alignItems: 'stretch',
      justifyContent: 'flex-start'
    },
    pageContainer: {
      flex: 1
    }
  };
});
