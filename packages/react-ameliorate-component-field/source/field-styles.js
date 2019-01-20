import { createStyleSheet } from '@react-ameliorate/styles';

export default createStyleSheet(function(theme) {
  return {
    rootContainer: {
      position: 'relative',
      flex: 0,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-start',
      overflow: 'hidden'
    }
  };
});
