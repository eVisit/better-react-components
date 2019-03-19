import PropTypes from '@react-ameliorate/prop-types';

export const ViewToken = PropTypes.shape({
  item: PropTypes.any,
  key: PropTypes.string,
  index: PropTypes.number,
  isViewable: PropTypes.boolean,
  section: PropTypes.any
});

export const ViewabilityConfig = PropTypes.shape({
  minimumViewTime: PropTypes.number,
  viewAreaCoveragePercentThreshold: PropTypes.number,
  itemVisiblePercentThreshold: PropTypes.number,
  waitForInteraction: PropTypes.boolean
});

export const ViewabilityConfigCallbackPair = PropTypes.shape({
  viewabilityConfig: ViewabilityConfig,
  onViewableItemsChanged: PropTypes.func //(info: { viewableItems: Array<ViewToken>, changed: Array<ViewToken> }) => void,
});
