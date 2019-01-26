import { createStyleSheet }   from '@react-ameliorate/styles';
import { binaryFieldStyles }  from '@react-ameliorate/component-binary-field';

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
        userSelect: 'none'
      }
    },
    binaryNodeContainer: {
      flex: 0,
      width: theme.DEFAULT_INPUT_HEIGHT,
      height: theme.DEFAULT_INPUT_HEIGHT,
      alignItems: 'center',
      justifyContent: 'center'
    },
    checkbox: {
      flex: 0,
      borderWidth: 1,
      borderRadius: theme.DEFAULT_BORDER_RADIUS,
      borderColor: theme.MAIN_COLOR,
      width: theme.DEFAULT_INPUT_HEIGHT * 0.55,
      height: theme.DEFAULT_INPUT_HEIGHT * 0.55,
      alignItems: 'center',
      justifyContent: 'center'
    }
  };
}, {
  mergeStyles: binaryFieldStyles
});
