import { createStyleSheet } from '@react-ameliorate/styles';
import { textFieldStyles }  from '@react-ameliorate/component-text-field';

export default createStyleSheet(function(theme, textFieldStyles) {
  const FIELD_SIDE_PADDING = textFieldStyles.FIELD_SIDE_PADDING;

  return {
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
    }
  };
}, {
  mergeStyles: textFieldStyles
});
