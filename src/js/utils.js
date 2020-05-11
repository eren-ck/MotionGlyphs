/* global d3*/

/**
 * utility functionalities
 * @author Eren Cakmak eren.cakmak@uni-konstanz.de
 */
/**
 * compute the angle between two points
 * @param {Number} cx point 1 x
 * @param {Number} cy point 1 y
 * @param {Number} ex point 2 x
 * @param {Number} ey point 2 y
 * @return {Number} radian
 */
export function angle(cx, cy, ex, ey) {
  const dy = ey - cy;
  const dx = ex - cx;
  return Math.atan2(dy, dx) + Math.PI / 2;
}

/**
 * Make an svg responsive
 * @param {Object} svg svg object to responsivy
 */
export function responsivefy(svg) {
  const container = d3.select(svg.node().parentNode);
  const width = parseInt(svg.style('width'));
  const height = parseInt(svg.style('height'));
  const aspect = width / height;

  svg
    .attr('viewBox', '0 0 ' + width + ' ' + height)
    .attr('perserveAspectRatio', 'xMinYMid')
    .call(resize);

  d3.select(window).on('resize.' + container.attr('id'), resize);

  /**
   * get width of container and resize svg to fit it
   */
  function resize() {
    const targetWidth = parseInt(container.style('width'));
    svg.attr('width', targetWidth);
    svg.attr('height', Math.round(targetWidth / aspect));
  }
}
