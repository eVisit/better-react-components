import { createStyleSheet } from '@react-ameliorate/styles';

export default createStyleSheet(function(theme) {
  return {
    container: {
      flex: 1,
      overflow: 'hidden',
      flexBasis: '0%'
    },
    northContainer: {
      flexDirection: 'column'
    },
    eastContainer: {
      flexDirection: 'row'
    },
    southContainer: {
      flexDirection: 'column'
    },
    westContainer: {
      flexDirection: 'row'
    },
    pageContainer: {
      flex: 1,
      overflow: 'hidden'
    }
  };
});
