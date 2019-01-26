import { createStyleSheet } from '@react-ameliorate/styles';
import { fieldStyles }      from '@react-ameliorate/component-field';

export default createStyleSheet(function(theme) {
  const FIELD_SIDE_PADDING = Math.round(theme.DEFAULT_PADDING * 0.25);

  return {
    FIELD_SIDE_PADDING,
    container: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-start',
      browser: {
        cursor: 'pointer'
      }
    },
    binaryNodeContainer: {
      flex: 0,
      width: theme.DEFAULT_INPUT_HEIGHT,
      height: theme.DEFAULT_INPUT_HEIGHT,
      alignItems: 'center',
      justifyContent: 'center'
    },
    binaryFieldIcon: {
      fontSize: theme.DEFAULT_FONT_SIZE,
      color: theme.MAIN_COLOR
    },
    caption: {
      fontSize: theme.DEFAULT_FONT_SIZE,
      color: theme.textColor(theme.contrastColor(theme.MAIN_COLOR), 7)
    }
  };
}, {
  mergeStyles: fieldStyles
});
