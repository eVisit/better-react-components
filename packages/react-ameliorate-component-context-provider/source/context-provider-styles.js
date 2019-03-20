import { createStyleSheet } from '@react-ameliorate/styles';

export default createStyleSheet(function(theme) {
  return {
    container: {
      backgroundColor: theme.contrastColor(theme.MAIN_COLOR),
      minWidth: theme.SCREEN_WIDTH * 0.18,
      minHeight: theme.SCREEN_HEIGHT * 0.08,
      borderRadius: theme.DEFAULT_BORDER_RADIUS,
      borderWidth: 1,
      borderStyle: 'solid',
      borderColor: theme.blendColors(theme.contrastColor(theme.MAIN_COLOR), theme.transparentColor(theme.GREY02_COLOR))
    }
  };
});
