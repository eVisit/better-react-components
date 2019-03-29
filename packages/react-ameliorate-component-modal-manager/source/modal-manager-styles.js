import { createStyleSheet } from '@react-ameliorate/styles';

export default createStyleSheet(function(theme) {
  return {
    fullSize: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0
    },
    overlay: {
      backgroundColor: theme.transparentColor(theme.inverseContrastColor(theme.MAIN_COLOR))
    },
    childContainer: {
      position: 'absolute',
      top: 0,
      right: 0,
      left: 0,
      bottom: 0,
      alignItems: 'center',
      justifyContent: 'center'
    }
  };
});
