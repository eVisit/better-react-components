import PropTypes          from '@react-ameliorate/prop-types';
import TouchablePropTypes from './touchable';

const TouchableOpacityPropTypes = {
  ...TouchablePropTypes,
  activeOpacity: PropTypes.number,
  hasTVPreferredFocus: PropTypes.bool,
  tvParallaxProperties: PropTypes.object
};

export default TouchableOpacityPropTypes;
