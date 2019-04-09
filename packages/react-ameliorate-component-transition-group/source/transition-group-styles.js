import { createStyleSheet } from '@react-ameliorate/styles';

export default createStyleSheet(function(theme) {
  return {
    container: {
      flex: 0,
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center'
    }
  };
});
