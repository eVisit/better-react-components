import { createStyleSheet } from '@react-ameliorate/styles';

export default createStyleSheet(function(theme) {
  const POPUP_ARROW_SIZE = Math.round(theme.DEFAULT_PADDING * 0.45),
        POPUP_ARROW_SIZE_HALF = POPUP_ARROW_SIZE * 0.5,
        POPUP_COLOR = theme.GREY02_COLOR,
        POPUP_ARROW_COLOR = theme.blendColors(POPUP_COLOR, theme.transparentColor('black', 0.1));

  return {
    POPUP_ARROW_SIZE,
    POPUP_ARROW_SIZE_HALF,
    POPUP_COLOR,
    POPUP_ARROW_COLOR,
    container: {
      backgroundColor: 'transparent',
      padding: POPUP_ARROW_SIZE_HALF
    },
    containerRight: {
    },
    containerLeft: {
    },
    containerTop: {
    },
    containerBottom: {
    },
    innerContainer: {
      flex: 0,
      overflow: 'hidden',
      borderRadius: theme.DEFAULT_BORDER_RADIUS,
      padding: theme.DEFAULT_PADDING * 0.2,
      backgroundColor: POPUP_COLOR
    },
    arrow: {
      position: 'absolute',
      backgroundColor: 'transparent',
      borderLeftColor: 'transparent',
      borderRightColor: 'transparent',
      borderBottomColor: 'transparent',
      borderTopColor: 'transparent',
      borderWidth: POPUP_ARROW_SIZE_HALF,
      borderStyle: 'solid',
      width: POPUP_ARROW_SIZE,
      height: POPUP_ARROW_SIZE
    },
    arrowHCenter: {
      left: '50%'
    },
    arrowHLeft: {
      left: theme.DEFAULT_BORDER_RADIUS,
    },
    arrowHRight: {
      right: theme.DEFAULT_BORDER_RADIUS,
    },
    arrowVCenter: {
      top: '50%'
    },
    arrowVTop: {
      top: theme.DEFAULT_BORDER_RADIUS,
    },
    arrowVBottom: {
      bottom: theme.DEFAULT_BORDER_RADIUS,
    },
    arrowDown: {
      bottom: 0,
      borderTopColor: POPUP_ARROW_COLOR
    },
    arrowUp: {
      top: 0,
      borderBottomColor: POPUP_ARROW_COLOR
    },
    arrowLeft: {
      left: 0,
      borderRightColor: POPUP_ARROW_COLOR
    },
    arrowRight: {
      right: 0,
      borderLeftColor: POPUP_ARROW_COLOR
    }
  };
});
