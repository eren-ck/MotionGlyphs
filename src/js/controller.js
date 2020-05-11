/* global $*/

/**
 * Controller for the animation in the environment
 * @author Eren Cakmak eren.cakmak@uni-konstanz.de
 */

import { getPlayBoolean } from './init.js';
import { getGroupedData } from './data.js';
import { DynamicNetwork } from './vis/network.js';
import { Glyph } from './vis/glyph.js';

let moveTank;
let vis;

const timeToWait = 100;
let numClusters = 0;

/**
 * Draw
 */
export function draw() {
  // the timeout is set after one update 30 ms
  setTimeout(function () {
    // get the time moment
    const time = parseInt($('#time-slider').val());

    // increase time by one
    $('#time-slider').val(time + 1);
    document.getElementById('time-slider-text').value = time + 1;
    if ($('#time-slider').val() >= parseInt($('#time-slider').attr('max'))) {
      $('#time-slider').val($('#time-slider').attr('min'));
      document.getElementById('time-slider-text').value = $(
        '#time-slider'
      ).val();
    }
    if (getPlayBoolean()) {
      if (moveTank.svg.selectAll('*').empty()) {
        const sel = $('input[name="radio-vis"]:checked').attr('value');

        if (sel === 'network') {
          vis = new DynamicNetwork(moveTank, getGroupedData(), numClusters);
        } else if (sel === 'glyph') {
          vis = new Glyph(moveTank, getGroupedData(), numClusters);
        }
      }
      // if else dynamic network
      vis.draw(time);
      draw();
    }
  }, timeToWait);
}

/**
 * Set the movement tank for the controller module
 * @param {MoveTank} tank Movement environment
 */
export function setMoveTank(tank) {
  moveTank = tank;
}

/**
 * Remove all elements from the tank
 */
export function resetTank() {
  if (moveTank) {
    moveTank.remove();
  }
}

export function updateVis() {
  // draw once if the play button is not active
  if (!getPlayBoolean()) {
    const time = parseInt($('#time-slider').val());
    if (moveTank.svg.selectAll('*').empty()) {
      const sel = $('input[name="radio-vis"]:checked').attr('value');

      if (sel === 'network') {
        vis = new DynamicNetwork(moveTank, getGroupedData(), numClusters);
      } else if (sel === 'glyph') {
        vis = new Glyph(moveTank, getGroupedData(), numClusters);
      }
    }
    // if else dynamic network
    // two times needes for the arc Enter upadte
    vis.draw(time);
    vis.draw(time);
  }
}

/**
 * Remove the tank
 */
export function removeTank() {
  if (moveTank) {
    d3.select('#container *').remove();
  }
}

/**
 * Set the number of max cluster var
 * @param {Number} val number
 */
export function setNumberClusters(val) {
  numClusters = val;
}
