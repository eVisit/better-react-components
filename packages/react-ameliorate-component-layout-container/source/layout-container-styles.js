import { createStyleSheet } from '@react-ameliorate/styles';

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
    spacer: {
      flex: 0
    }
  };
});
