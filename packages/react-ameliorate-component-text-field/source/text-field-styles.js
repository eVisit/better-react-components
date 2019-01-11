import { createStyleSheet } from '@base';
import fieldStyles          from '../field/field-styles';

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
    inputField: {
      flexGrow: 1,
      flexShrink: 1,
      flexBasis: 0,
      width: '100%',
      minHeight: theme.DEFAULT_INPUT_HEIGHT,
      borderColor: theme.MAIN_COLOR,
      borderStyle: 'solid',
      borderBottomWidth: 1,
      fontSize: theme.DEFAULT_FONT_SIZE,
      paddingLeft: FIELD_SIDE_PADDING,
      paddingRight: FIELD_SIDE_PADDING,
      paddingTop: FIELD_SIDE_PADDING,
      color: theme.textColor(theme.contrastColor(theme.MAIN_COLOR), 7)
    },
    fieldStateError: {
      color: theme.ERROR_COLOR,
      borderColor: theme.ERROR_COLOR
    }
  };
}, {
  mergeStyles: fieldStyles
});