/* global $*/

/**
 * Initilaize svg and listerners for buttons etc.
 * @author Eren Cakmak eren.cakmak@uni-konstanz.de
 */

import {
  getTimeRange,
  getEnvironmentExtent,
  getLinkRange,
  getNumberClusters,
  getNumberClustering,
} from './data.js';
import {
  draw,
  setMoveTank,
  resetTank,
  setNumberClusters,
  updateVis,
} from './controller.js';
import { MoveTank } from './environment.js';

let playBoolean = false; // pause and play boolean

/**
 * Initilaize the responsive SVGs in the overview and details div
 */
export function init() {
  _removeListeners();
  _initSVGs();
  _initNavBar();
  _initCluster();
}

/**
 * Initilaize the nav bar with play pause etc.
 */
function _initNavBar() {
  /* off-canvas sidebar toggle */
  $('#menu-toggle').click(function (e) {
    e.preventDefault();
    $('#wrapper').toggleClass('toggled');
  });
  // init the range slider
  const timeSpan = getTimeRange();
  $('#time-slider').attr({
    min: timeSpan[0] ? timeSpan[0] : 0,
    max: timeSpan[1] ? timeSpan[1] : 1,
  });
  $('#time-slider').val(timeSpan[0] ? timeSpan[0] : 0);
  // $('#time-slider').val($('#slider').val()*1 + delta)
  $('#time-slider').on('input change', function () {
    document.getElementById('time-slider-text').value = parseInt(this.value);
    updateVis();
  });

  // weight link slider
  const linkRange = getLinkRange();
  $('#filter-links-slider')
    .attr({
      min: linkRange[0] ? linkRange[0] : 0,
      max: linkRange[1] ? linkRange[1] : 1,
      step:
        (linkRange[1] - linkRange[0]) / 100
          ? (linkRange[1] - linkRange[0]) / 100
          : 1,
    })
    .on('change input', function () {
      updateVis();
    });
  $('#filter-links-slider').val(0);
  const numberClusterings = getNumberClustering();
  $('#cluster-slider').attr('max', numberClusterings);
  $('#cluster-slider')
    .on('change input', function () {
      $(this).attr('dist', this.value);
      updateVis();
    })
    .change();
  // uncheck the cluster checkbox and set the cluster slider to the granularities
  $('#cluster-checkbox').prop('checked', false);

  $('#cluster-checkbox').change(function () {
    updateVis();
  });

  // init the play and pause buttions
  $('#play-button').click(function () {
    playBoolean = !playBoolean;
    draw();
  });

  $('#pause-button').click(function () {
    playBoolean = false;
  });

  // radio buttons
  $('input[name="radio-vis"]').on('click change', function (e) {
    resetTank();
    updateVis();
  });

  $('input[name="radio-arc"]').on('click change', function (e) {
    updateVis();
  });

  $('input[name="radio-features"]').on('click change', function (e) {
    updateVis();
  });

  // modal link click
  $('#modal-link').on('click', function () {
    $('#getting-started-modal').modal('show');
  });

  // init bootstrap tooltip
  $(function () {
    $('[data-toggle="tooltip"]').tooltip();
  });
}

/**
 * Initilaize the svgs
 */
function _removeListeners() {
  $('#menu-toggle').unbind();
  $('#time-slider').unbind();
  $('#filter-links-slider').unbind();
  $('#cluster-slider').unbind();
  $('#play-button').unbind();
  $('#pause-button').unbind();
  $('input[name="radio-vis"]').unbind();
  $('input[name="radio-arc"]').unbind();
  $('input[name="radio-features"]').unbind();
  $('#cluster-checkbox').unbind();
}

/**
 * Initilaize the svgs
 */
function _initSVGs() {
  //  get min max of the movement
  const extent = getEnvironmentExtent();
  // Create and set the new environment
  setMoveTank(new MoveTank('div#container', extent));
}
/**
 * Initilaize cluster variables
 */
function _initCluster() {
  // get min max of the movement and set the value
  setNumberClusters(getNumberClusters());
}

/**
 * Return the play boolean
 * @return {Boolean} playBoolean
 */
export function getPlayBoolean() {
  return playBoolean;
}
