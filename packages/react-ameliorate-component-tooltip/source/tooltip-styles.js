import { createStyleSheet } from '@react-ameliorate/styles';
import { popupStyles }      from '@react-ameliorate/component-popup';

export default createStyleSheet(function(theme, popupStyles) {
  var BG_COLOR = theme.TOOLTIP_COLOR,
      POPUP_ARROW_COLOR = theme.blendColors(BG_COLOR, theme.transparentColor('white', 0.1));

  return {
    tooltipContainer: {
      flex: 0,
      browser: {
        userSelect: 'none'
      },
    },
    innerContainer: {
      maxWidth: theme.TOOLTIP_MAX_WIDTH || 300,
      backgroundColor: BG_COLOR
    },
    arrowDown: {
      borderTopColor: POPUP_ARROW_COLOR
    },
    arrowUp: {
      borderBottomColor: POPUP_ARROW_COLOR
    },
    arrowLeft: {
      borderRightColor: POPUP_ARROW_COLOR
    },
    arrowRight: {
      borderLeftColor: POPUP_ARROW_COLOR
    },
    tooltipCaption: {
      color: theme.textColor(BG_COLOR, 6)
    }
  };
}, {
  mergeStyles: popupStyles
});
