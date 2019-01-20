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
      justifyContent: 'flex-start'
    },
    binaryNodeContainer: {
      flex: 0,
      width: theme.DEFAULT_INPUT_HEIGHT,
      height: theme.DEFAULT_INPUT_HEIGHT,
      alignItems: 'center',
      justifyContent: 'center'
    }
  };
}, {
  mergeStyles: fieldStyles
});
