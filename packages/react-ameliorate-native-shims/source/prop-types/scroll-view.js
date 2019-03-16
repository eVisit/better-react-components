import PropTypes            from '@react-ameliorate/prop-types';
import ViewPropTypes        from './view';
import EdgeInsetsPropType   from './edge-insets';
import PointPropType        from './point';
import StyleSheetPropType   from './style-sheet';
import ViewStylePropTypes   from './view-style';

const ScrollViewPropTypes = {
  ...ViewPropTypes,

  // iOS
  automaticallyAdjustContentInsets: PropTypes.bool,
  contentInset: EdgeInsetsPropType,
  contentOffset: PointPropType,
  contentContainerStyle: StyleSheetPropType(ViewStylePropTypes),
  bounces: PropTypes.bool,
  bouncesZoom: PropTypes.bool,
  alwaysBounceHorizontal: PropTypes.bool,
  alwaysBounceVertical: PropTypes.bool,
  centerContent: PropTypes.bool,
  indicatorStyle: PropTypes.oneOf([
    'default',
    'black',
    'white'
  ]),
  directionalLockEnabled: PropTypes.bool,
  canCancelContentTouches: PropTypes.bool,
  maintainVisibleContentPosition: PropTypes.shape({
    minIndexForVisible: PropTypes.number,
    autoscrollToTopThreshold: PropTypes.number,
  }),
  maximumZoomScale: PropTypes.number,
  minimumZoomScale: PropTypes.number,
  pinchGestureEnabled: PropTypes.bool,
  scrollEventThrottle: PropTypes.number,
  scrollIndicatorInsets: EdgeInsetsPropType,
  scrollsToTop: PropTypes.bool,
  showsHorizontalScrollIndicator: PropTypes.bool,
  snapToAlignment: PropTypes.oneOf([
    'start',
    'center',
    'end'
  ]),
  zoomScale: PropTypes.number,
  contentInsetAdjustmentBehavior: PropTypes.oneOf([
    'automatic',
    'scrollableAxes',
    'never',
    'always'
  ]),

  // Android
  nestedScrollEnabled: PropTypes.bool,
  endFillColor: PropTypes.any,
  scrollPerfTag: PropTypes.string,
  overScrollMode: PropTypes.oneOf([
    'auto',
    'always',
    'never'
  ]),
  scrollBarThumbImage: PropTypes.oneOfType([PropTypes.number, PropTypes.string])
};

export default ScrollViewPropTypes;
