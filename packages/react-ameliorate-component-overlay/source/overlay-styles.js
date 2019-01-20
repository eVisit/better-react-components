import { createStyleSheet } from '@react-ameliorate/styles';

export default createStyleSheet(function(theme) {
  return {
    container: {
      flex: 0,
      width: '100%',
      height: '100%',
      overflow: 'hidden'
    },
    overlay: {
      flex: 0,
      position: 'absolute',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      left: 0,
      right: 0,
      top: 0,
      bottom: 0,
      zIndex: 100,
      browser: {
        pointerEvents: 'none'
      }
    },
    containerHasChildren: {
    },
    containerNoChildren: {
    },
    childContainer: {
      position: 'absolute',
      zIndex: 1,
      browser: {
        pointerEvents: 'auto'
      }
    },
    defaultPaperStyle: {
      position: 'absolute',
      left: 0,
      top: 0,
      right: 0,
      bottom: 0
    }
  };
});
