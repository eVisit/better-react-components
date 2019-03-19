import { createStyleSheet } from '@react-ameliorate/styles';
import { formStyles }       from '@react-ameliorate/component-form';

export default createStyleSheet(function(theme) {
  return {
    rootContainer: {
      position: 'relative',
      flexDirection: 'column'
    }
  };
}, {
  mergeStyles: formStyles
});
