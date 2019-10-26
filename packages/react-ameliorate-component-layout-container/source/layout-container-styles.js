import { createStyleSheet } from '@react-ameliorate/styles';

export default createStyleSheet(function(theme) {
  return {
    container: {
      flex: 0,
      justifyContent: 'flex-start',
      flexBasis: '0%'
    },
    containerHorizontal: {
      flexDirection: 'row'
    },
    containerVertical: {
      flexDirection: 'column'
    },
    spacer: {
      flex: 0,
      alignSelf: 'stretch'
    }
  };
});
