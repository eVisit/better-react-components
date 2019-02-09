import PropTypes          from '@react-ameliorate/prop-types';
import EdgeInsetsPropType from './edge-insets';
import {
  AccessibilityComponentTypes,
  AccessibilityRoles,
  AccessibilityStates,
  AccessibilityTraits
}                         from './view-accessibility';
import StyleSheetPropType from './style-sheet';
import ViewStylePropTypes from './view-style';

const ViewPropTypes = {
  accessible: PropTypes.bool,
  accessibilityLabel: PropTypes.node,
  accessibilityHint: PropTypes.string,
  accessibilityActions: PropTypes.arrayOf(PropTypes.string),
  accessibilityIgnoresInvertColors: PropTypes.bool,
  accessibilityComponentType: PropTypes.oneOf(AccessibilityComponentTypes),
  accessibilityRole: PropTypes.oneOf(AccessibilityRoles),
  accessibilityStates: PropTypes.arrayOf(PropTypes.oneOf(AccessibilityStates)),
  accessibilityLiveRegion: PropTypes.oneOf(['none', 'polite', 'assertive']),
  importantForAccessibility: PropTypes.oneOf([
    'auto',
    'yes',
    'no',
    'no-hide-descendants',
  ]),
  accessibilityTraits: PropTypes.oneOfType([
    PropTypes.oneOf(AccessibilityTraits),
    PropTypes.arrayOf(PropTypes.oneOf(AccessibilityTraits)),
  ]),
  accessibilityViewIsModal: PropTypes.bool,
  accessibilityElementsHidden: PropTypes.bool,
  onAccessibilityAction: PropTypes.func,
  onAccessibilityTap: PropTypes.func,
  onMagicTap: PropTypes.func,
  testID: PropTypes.string,
  nativeID: PropTypes.string,
  onResponderGrant: PropTypes.func,
  onResponderMove: PropTypes.func,
  onResponderReject: PropTypes.func,
  onResponderRelease: PropTypes.func,
  onResponderTerminate: PropTypes.func,
  onResponderTerminationRequest: PropTypes.func,
  onStartShouldSetResponder: PropTypes.func,
  onStartShouldSetResponderCapture: PropTypes.func,
  onMoveShouldSetResponder: PropTypes.func,
  onMoveShouldSetResponderCapture: PropTypes.func,
  hitSlop: EdgeInsetsPropType,
  onLayout: PropTypes.func,
  pointerEvents: PropTypes.oneOf(['box-none', 'none', 'box-only', 'auto']),
  style: StyleSheetPropType(ViewStylePropTypes),
  removeClippedSubviews: PropTypes.bool,
  renderToHardwareTextureAndroid: PropTypes.bool,
  shouldRasterizeIOS: PropTypes.bool,
  collapsable: PropTypes.bool,
  needsOffscreenAlphaCompositing: PropTypes.bool
};

export default ViewPropTypes;
