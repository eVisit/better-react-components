import { createStyleSheet }   from '@react-ameliorate/styles';
import { genericModalStyles } from '@react-ameliorate/component-generic-modal';

export default createStyleSheet(function(theme) {
  return {
    contentText: {
      color: theme.textColor(theme.contrastColor(theme.MAIN_COLOR), 7)
    }
  };
}, {
  mergeStyles: genericModalStyles
});
