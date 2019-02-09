import PropTypes                from '@react-ameliorate/prop-types';
import EdgeInsetsPropType       from './edge-insets';
import ViewPropTypes            from './view';
import {
  AccessibilityComponentTypes,
  AccessibilityRoles,
  AccessibilityStates,
  AccessibilityTraits
}                               from './view-accessibility';

const TouchablePropTypes = {
  accessible: PropTypes.bool,
  accessibilityLabel: PropTypes.node,
  accessibilityHint: PropTypes.string,
  accessibilityComponentType: PropTypes.oneOf(AccessibilityComponentTypes),
  accessibilityRole: PropTypes.oneOf(AccessibilityRoles),
  accessibilityStates: PropTypes.arrayOf(
    PropTypes.oneOf(AccessibilityStates),
  ),
  accessibilityTraits: PropTypes.oneOfType([
    PropTypes.oneOf(AccessibilityTraits),
    PropTypes.arrayOf(PropTypes.oneOf(AccessibilityTraits)),
  ]),
  onFocus: PropTypes.func,
  onBlur: PropTypes.func,
  disabled: PropTypes.bool,
  onPress: PropTypes.func,
  onPressIn: PropTypes.func,
  onPressOut: PropTypes.func,
  onLayout: PropTypes.func,
  onLongPress: PropTypes.func,
  nativeID: PropTypes.string,
  testID: PropTypes.string,
  delayPressIn: PropTypes.number,
  delayPressOut: PropTypes.number,
  delayLongPress: PropTypes.number,
  pressRetentionOffset: EdgeInsetsPropType,
  hitSlop: EdgeInsetsPropType,
  style: ViewPropTypes.style
};

export default TouchablePropTypes;
