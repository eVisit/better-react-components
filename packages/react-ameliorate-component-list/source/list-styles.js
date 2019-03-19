import { createStyleSheet } from '@react-ameliorate/styles';

export default createStyleSheet(function(theme) {
  return {
    separator: {
      flex: 0,
      height: 1,
      backgroundColor: theme.GREY01_COLOR
    }
  };
});
