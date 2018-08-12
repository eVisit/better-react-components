class Dimensions {
  static get(type) {
    var devicePixelRatio = 1,
        width = 1,
        height = 1;

    if (typeof window !== 'undefined' && window) {
      devicePixelRatio = window.devicePixelRatio || 1;
      width = window.innerWidth;
      height = window.innerHeight;
    }

    return {
      width,
      height,
      physicalWidth: width * devicePixelRatio,
      physicalHeight: height * devicePixelRatio,
      scale: devicePixelRatio,
      pixelRatio: 1 / devicePixelRatio
    };
  }
}

module.exports = {
  Dimensions
};
