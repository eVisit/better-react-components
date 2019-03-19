import { createStyleSheet } from '@react-ameliorate/styles';

export default createStyleSheet(function(theme) {
  return {
    rootContainer: {
      position: 'relative',
      flexDirection: 'column',
      alignItems: 'stretch'
    },
    row: {
      flex: 0,
      flexDirection: 'row'
    },
    childWrapper: {
      flexBasis: 0
    }
  };
});
