import { createStyleSheet } from '@react-ameliorate/styles';

export default createStyleSheet(function(theme) {
  const MODAL_BUTTON_HORIZONTAL_SPACING  = (theme.IS_MOBILE) ?  1 : Math.round(theme.DEFAULT_PADDING * 0.5),
        MINIMUM_MODAL_WIDTH   = (theme.IS_MOBILE) ? (theme.SCREEN_WIDTH * 0.5) : (theme.SCREEN_WIDTH * 0.2),
        MINIMUM_MODAL_HEIGHT  = (theme.IS_MOBILE) ? (theme.SCREEN_HEIGHT * 0.05) : (theme.SCREEN_HEIGHT * 0.05);

  return {
    MODAL_BUTTON_HORIZONTAL_SPACING,
    MINIMUM_MODAL_WIDTH,
    MINIMUM_MODAL_HEIGHT,
    container: {
      flex: 0,
      flexDirection: 'column',
      alignItems: 'stretch',
      justifyContent: 'flex-start',
      backgroundColor: theme.contrastColor(theme.MAIN_COLOR),
      zIndex: 1
    },
    containerBorder: {
      borderRadius: theme.DEFAULT_BORDER_RADIUS,
      borderWidth: 1,
      borderStyle: 'solid',
      borderColor: theme.blendColors(theme.contrastColor(theme.MAIN_COLOR), theme.transparentColor(theme.GREY02_COLOR)),
    },
    defaultConstraints: {
      minWidth: MINIMUM_MODAL_WIDTH,
      minHeight: MINIMUM_MODAL_HEIGHT,
      maxWidth: theme.SCREEN_WIDTH,
      maxHeight: theme.SCREEN_HEIGHT,
    }
  };
});
