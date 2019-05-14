import { createStyleSheet }   from '@react-ameliorate/styles';
import { genericModalStyles } from '@react-ameliorate/component-generic-modal';

export default createStyleSheet(function(theme, genericModalStyles) {
  return {
    contentContainer: {
      paddingLeft: genericModalStyles.CONTENT_PADDING,
      paddingRight: genericModalStyles.CONTENT_PADDING
    },
    contentText: {
      color: theme.textColor(theme.contrastColor(theme.MAIN_COLOR), 6)
    },
    contentScrollContainer: {
      alignItems: 'stretch'
    },
    formContainer: {
      alignItems: 'stretch'
    }
  };
}, {
  mergeStyles: genericModalStyles
});
