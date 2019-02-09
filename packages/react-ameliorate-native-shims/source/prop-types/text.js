import PropTypes          from '@react-ameliorate/prop-types';
import EdgeInsetsPropType from './edge-insets';
import ColorPropType      from './color';
import StyleSheetPropType from './style-sheet';
import TextStylePropTypes from './text-style';

const TextPropTypes = {
  ellipsizeMode: PropTypes.oneOf(['head', 'middle', 'tail', 'clip']),
  numberOfLines: PropTypes.number,
  textBreakStrategy: PropTypes.oneOf(['simple', 'highQuality', 'balanced']),
  onLayout: PropTypes.func,
  onPress: PropTypes.func,
  onLongPress: PropTypes.func,
  pressRetentionOffset: EdgeInsetsPropType,
  selectable: PropTypes.bool,
  selectionColor: ColorPropType,
  suppressHighlighting: PropTypes.bool,
  style: StyleSheetPropType(TextStylePropTypes),
  testID: PropTypes.string,
  nativeID: PropTypes.string,
  allowFontScaling: PropTypes.bool,
  accessible: PropTypes.bool,
  adjustsFontSizeToFit: PropTypes.bool,
  minimumFontScale: PropTypes.number,
  disabled: PropTypes.bool
};

export default TextPropTypes;
