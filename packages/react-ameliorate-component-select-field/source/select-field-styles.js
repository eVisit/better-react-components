import { createStyleSheet } from '@react-ameliorate/styles';
import { fieldStyles }      from '@react-ameliorate/component-field';

export default createStyleSheet(function(theme) {
  const OPTION_BG_COLOR = theme.blendColors(theme.contrastColor(theme.MAIN_COLOR), theme.transparentColor(theme.GREY01_COLOR)),
        BORDER_COLOR = theme.blendColors(OPTION_BG_COLOR, theme.transparentColor(theme.GREY03_COLOR)),
        ARROW_CONTAINER_SIZE = theme.DEFAULT_INPUT_HEIGHT,
        LOADING_SPINNER_SIZE = "small",
        DEFAULT_OPTION_HEIGHT = theme.DEFAULT_INPUT_HEIGHT;

  return {
    OPTION_BG_COLOR,
    BORDER_COLOR,
    LOADING_SPINNER_SIZE,
    DEFAULT_OPTION_HEIGHT,
    container: {
      flex: 1,
      flexDirection: 'column',
      alignItems: 'stretch',
      justifyContent: 'flex-start'
    },
    fieldContainer: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-start'
    },
    field: {
      flex: 1
    },
    textField: {
      browser: {
        cursor: 'pointer'
      }
    },
    arrowContainer: {
      position: 'absolute',
      flex: 0,
      width: ARROW_CONTAINER_SIZE,
      height: ARROW_CONTAINER_SIZE,
      alignItems: 'center',
      justifyContent: 'center',
      top: 0,
      right: 0,
      browser: {
        cursor: 'pointer'
      }
    },
    arrow: {
      fontSize: theme.DEFAULT_FONT_SIZE,
      color: theme.GREY06_COLOR
    },
    optionsContainer: {
      flex: 0,
      alignItems: 'stretch',
      maxHeight: DEFAULT_OPTION_HEIGHT * 10,
      backgroundColor: OPTION_BG_COLOR,
      borderColor: BORDER_COLOR,
      borderStyle: 'solid',
      borderLeftWidth: 1,
      borderRightWidth: 1
    },
    optionContainer: {
      paddingLeft: theme.DEFAULT_PADDING * 0.25,
      paddingRight: theme.DEFAULT_PADDING * 0.25,
      flex: 0,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-start',
      height: DEFAULT_OPTION_HEIGHT,
      borderColor: BORDER_COLOR,
      borderStyle: 'solid',
      borderBottomWidth: 1,
      browser: {
        cursor: 'pointer'
      }
    },
    optionCaption: {
      fontSize: theme.DEFAULT_FONT_SIZE
    },
    optionCaptionSelected: {
      color: theme.MAIN_COLOR
    },
    optionFocus: {
      backgroundColor: theme.blendColors(OPTION_BG_COLOR, theme.transparentColor(theme.MAIN_COLOR))
    },
    optionHover: {
      backgroundColor: theme.blendColors(OPTION_BG_COLOR, theme.transparentColor(theme.MAIN_COLOR))
    },
    waitingSpinnerContainer: {
      position: 'absolute',
      flex: 0,
      width: ARROW_CONTAINER_SIZE,
      height: ARROW_CONTAINER_SIZE,
      alignItems: 'center',
      justifyContent: 'center',
      top: 0,
      right: ARROW_CONTAINER_SIZE - (ARROW_CONTAINER_SIZE * 0.325)
    }
  };
}, {
  mergeStyles: fieldStyles
});
