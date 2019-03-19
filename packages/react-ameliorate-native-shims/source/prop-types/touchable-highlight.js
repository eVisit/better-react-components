import PropTypes          from '@react-ameliorate/prop-types';
import TouchablePropTypes from './touchable';
import ColorPropType      from './color';

const TouchableHighlightPropTypes = {
  ...TouchablePropTypes,
  activeOpacity: PropTypes.number,
    underlayColor: ColorPropType,
    onShowUnderlay: PropTypes.func,
    onHideUnderlay: PropTypes.func,
    hasTVPreferredFocus: PropTypes.bool,
    tvParallaxProperties: PropTypes.object,
    testOnly_pressed: PropTypes.bool
};

export default TouchableHighlightPropTypes;
