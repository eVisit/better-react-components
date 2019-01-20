import { createStyleSheet } from '@react-ameliorate/styles';

export default createStyleSheet(function(theme) {
  const ARROW_SIZE = theme.DEFAULT_PADDING * 0.25,
        ARROW_SIZE_HALF = ARROW_SIZE * 0.5,
        POPUP_COLOR = theme.GREY02_COLOR;

  return {
    container: {
      backgroundColor: 'transparent'
    },
    containerRight: {
      paddingLeft: ARROW_SIZE_HALF
    },
    containerLeft: {
      paddingRight: ARROW_SIZE_HALF
    },
    containerTop: {
      paddingBottom: ARROW_SIZE_HALF
    },
    containerBottom: {
      paddingTop: ARROW_SIZE_HALF
    },
    innerContainer: {
      overflow: 'hidden',
      borderRadius: theme.DEFAULT_RADIUS,
      padding: 1,
      backgroundColor: POPUP_COLOR
    },
    arrow: {
      position: 'absolute',
      backgroundColor: 'transparent',
      borderLeftColor: 'transparent',
      borderRightColor: 'transparent',
      borderBottomColor: 'transparent',
      borderTopColor: 'transparent',
      borderWidth: ARROW_SIZE_HALF,
      borderStyle: 'solid',
      width: ARROW_SIZE,
      height: ARROW_SIZE
    }
  };
});
