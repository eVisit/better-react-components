import { createStyleSheet } from '@react-ameliorate/styles';

export default createStyleSheet(function(theme) {
  const DEFAULT_TOGGLED_BUTTON_BG_COLOR = theme.blendColors(theme.contrastColor(theme.MAIN_COLOR), theme.transparentColor(theme.MAIN_COLOR, 1 - theme.DEFAULT_HOVER_OPACITY)),
        DEFAULT_CONTAINER_BORDER_RADIUS = theme.DEFAULT_BORDER_RADIUS;

  return {
    DEFAULT_TOGGLED_BUTTON_BG_COLOR,
    DEFAULT_CONTAINER_BORDER_RADIUS,
    container: {
      flex: 0,
      flexDirection: 'row',
      alignItems: 'stretch',
      justifyContent: 'flex-start',
      borderWidth: 1,
      borderColor: theme.MAIN_COLOR,
      borderStyle: 'solid',
      borderRadius: DEFAULT_CONTAINER_BORDER_RADIUS,
      overflow: 'hidden'
    },
    horizontalContainer: {
    },
    verticalContainer: {
    },
    buttonContainer: {
      flex: 0,
      browser: {
        cursor: 'pointer'
      },
      alignItems: 'stretch',
      justifyContent: 'center'
    },
    horizontalButtonContainer: {
    },
    verticalButtonContainer: {
    },
    button: {
      flex: 0,
      padding: theme.DEFAULT_PADDING * 0.2,
      textAlign: 'center',
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 0,
      borderRadius: 0
    },
    buttonToggled: {
      backgroundColor: DEFAULT_TOGGLED_BUTTON_BG_COLOR
    },
    horizontalButton: {
      flexDirection: 'row'
    },
    verticalButton: {
      flexDirection: 'column'
    },
    buttonIconContainer: {
    },
    buttonIcon: {
      fontSize: theme.FONT_SIZE_SMALL,
      color: theme.contrastColor(theme.MAIN_TEXT_COLOR)
    },
    buttonIconToggled: {
      color: theme.textColor(theme.MAIN_COLOR)
    },
    buttonCaptionContainer: {
      flex: 0,
      alignItems: 'center',
      justifyContent: 'center'
    },
    horizontalButtonCaptionContainer: {
      paddingLeft: theme.DEFAULT_PADDING * 0.2,
    },
    verticalButtonCaptionContainer: {
      paddingTop: theme.DEFAULT_PADDING * 0.2,
    },
    buttonCaption: {
      fontSize: theme.FONT_SIZE_SMALL,
      color: theme.textColor(theme.contrastColor(theme.MAIN_COLOR), 6)
    },
    buttonCaptionToggled: {
      color: theme.textColor(theme.MAIN_COLOR)
    },
    spacer: {
      backgroundColor: theme.MAIN_COLOR
    }
  };
});
