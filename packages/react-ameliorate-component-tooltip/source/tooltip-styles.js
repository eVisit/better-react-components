import { createStyleSheet } from '@react-ameliorate/styles';
import { popupStyles }      from '@react-ameliorate/component-popup';

export default createStyleSheet(function(theme, popupStyles) {
  var BG_COLOR = theme.TOOLTIP_COLOR,
      ARROW_COLOR = theme.blendColors(BG_COLOR, theme.transparentColor('white', 0.1));

  return {
    container: {
      flex: 0,
      browser: {
        userSelect: 'none'
      }
    },
    innerContainer: {
      backgroundColor: BG_COLOR
    },
    arrowDown: {
      borderTopColor: ARROW_COLOR
    },
    arrowUp: {
      borderBottomColor: ARROW_COLOR
    },
    arrowLeft: {
      borderRightColor: ARROW_COLOR
    },
    arrowRight: {
      borderLeftColor: ARROW_COLOR
    }
  };
}, {
  mergeStyles: popupStyles
});
