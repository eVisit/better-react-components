import { createStyleSheet } from '@base';

export default createStyleSheet(function(theme) {
  return {
    container: {
      flex: 0,
      justifyContent: 'flex-start'
    },
    containerHorizontal: {
      flexDirection: 'row'
    },
    containerVertical: {
      flexDirection: 'column'
    },
    childContainer: {
      flex: 0
    }
  };
});
