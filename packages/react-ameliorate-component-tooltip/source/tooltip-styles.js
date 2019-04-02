import { createStyleSheet } from '@react-ameliorate/styles';
import { popupStyles }      from '@react-ameliorate/component-popup';

export default createStyleSheet(function(theme) {
  return {
    container: {
      flex: 0,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      browser: {
        userSelect: 'none'
      }
    }
  };
}, {
  mergeStyles: popupStyles
});
