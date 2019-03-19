import PropTypes from '@react-ameliorate/prop-types';

const ActivityIndicatorPropTypes = {
  animating: PropTypes.bool,
  color: PropTypes.string,
  size: PropTypes.oneOfType([PropTypes.number, PropTypes.oneOf([
    'small',
    'large'
  ])])
};


export default ActivityIndicatorPropTypes;
