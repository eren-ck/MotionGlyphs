/* global $ , d3*/

/**
 * Movement environment of the prototype
 * @author Eren Cakmak eren.cakmak@uni-konstanz.de
 */
import { responsivefy } from './utils.js';

/**
 * MoveTank which is the movement environment of the animation
 * @constructor
 */
export class MoveTank {
  /**
   * Constructor for the level class
   * @param {selector} sel svg selector
   * @param {String} extent extent of the viewport
   */
  constructor(sel, extent) {
    const that = this;
    // set the svg to be responsive with view box etc.
    const elm = $(sel).parent();
    const margin = 40;
    const width = parseInt(elm.width()) - margin;
    const height = parseInt(elm.height()) - margin;
    // svg group
    this._svg = d3
      .select(sel)
      .append('svg')
      .attr('height', height)
      .attr('width', width)
      .call(responsivefy);

    // d3 zoom
    const zoom = d3
      .zoom()
      .extent([
        [0, 0],
        [width, height],
      ])
      .scaleExtent([1, 10])
      .translateExtent([
        [0, 0],
        [width, height],
      ])
      .on('zoom', function (d) {
        that._visGroup.attr('transform', d3.event.transform);
      });

    this._zoomGroup = this._svg.append('g').attr('id', 'zoom-group');

    // append a rect in the background ffor the zooming
    this._zoomRect = this._zoomGroup
      .append('rect')
      .attr('id', 'background-rect')
      .attr('x', 0)
      .attr('y', 0)
      .attr('width', width)
      .attr('height', height);

    this._visGroup = this._zoomGroup.append('g').attr('id', 'vis-group');

    // Create the scales
    const scaleMargin = 10;
    this._xScale = d3
      .scaleLinear()
      .domain([extent[0][0], extent[0][1]])
      .range([scaleMargin, width - scaleMargin]);

    this._yScale = d3
      .scaleLinear()
      .domain([extent[1][0], extent[1][1]])
      .range([scaleMargin, height - scaleMargin]);

    this._svg.call(zoom);
  }

  /**
   * Remove all elements in the svg
   */
  remove() {
    this._visGroup.selectAll('*').remove();
  }

  /**
   * SETTER AND GETTER
   */

  /**
   * Get the height of the cell
   */
  get svg() {
    return this._visGroup;
  }

  /**
   * Get the x scale of the move tank
   */
  get xScale() {
    return this._xScale;
  }
  /**
   * Get the y scale of the move tank
   */
  get yScale() {
    return this._yScale;
  }
}
