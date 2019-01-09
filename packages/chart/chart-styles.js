import ChartistStyles       from 'chartist/dist/chartist.min.css';
import { createStyleSheet } from '@base';

export default createStyleSheet(function(theme) {
  return {
    container: {
      position: 'relative',
      flex: 1,
      flexDirection: 'row'
    },
    chartStyle: {
      paddingLeft: 35,
      flex: 1
    }
  };
});
