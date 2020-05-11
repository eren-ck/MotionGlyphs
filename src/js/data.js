/* global d3*/

/**
 * Load initial test data set
 * Access the data using filtering etc.
 * @author Eren Cakmak eren.cakmak@uni-konstanz.de
 */

import { init } from './init.js';

let data; // the movement data and their relationships
let featureExtents = {};

/**
 * Load the movement data with features and the relationships
 * @param  {String} path    Path to data file
 */
export function loadData(path) {
  d3.csv(path)
    .then(function (d) {
      // convert values to numbers except for the animal_id
      data = d.map(function (value) {
        for (const key in value) {
          if (!isNaN(value[key])) {
            value[key] = Number(value[key]);
          }
        }
        return value;
      });
    })
    .catch(function (error) {
      alert(error);
    })
    .then(function () {
      // draw the default visualization
      init();
      $('#loading').hide();
      $('#play-icon').show();
    });
}

/**
 * Return the parsed data
 * @return {array} the parsed data
 */
export function getData() {
  return data;
}

/**
 * Return the time available time range
 * @return {array} time range
 */
export function getTimeRange() {
  return d3.extent(data, function (d) {
    return d['time'];
  });
}

/**
 * Return the link weights range
 * @return {array} the grouped data
 */
export function getLinkRange() {
  const matrixValues = data.map(function (d) {
    const arr = [];
    for (const key in d) {
      if (key.includes('m-')) {
        arr.push(d[key]);
      }
    }
    return arr;
  });
  // 2d to 1d conversion
  const arr = [];
  for (const row of matrixValues) {
    for (const e of row) {
      arr.push(e);
    }
  }
  return d3.extent(arr, function (d) {
    return d;
  });
}

/**
 * Group the data by time
 * @return {array} the grouped data
 */
export function getGroupedData() {
  const key = 'time';
  return data.reduce(function (r, a) {
    r[a[key]] = r[a[key]] || [];
    r[a[key]].push(a);
    return r;
  }, Object.create(null));
}
/**
 * Get the extent of the environment
 * @return {array} with min max
 */
export function getEnvironmentExtent() {
  const xExtent = d3.extent(data, function (d) {
    return d['x'];
  });

  const yExtent = d3.extent(data, function (d) {
    return d['y'];
  });
  return [xExtent, yExtent];
}

/**
 * Get the number of clusters
 * @return {Number} integer
 */
export function getNumberClusters() {
  let max = 0;
  data.forEach(function (d) {
    for (const key in d) {
      if (key.includes('c-')) {
        max = max < d[key] ? d[key] : max;
      }
    }
  });
  return max;
}

/**
 * Get the number of clusterings - the how many c- are in the csv
 * @return {Number} integer
 */
export function getNumberClustering() {
  let counter = -1;
  for (const key in data[0]) {
    if (key.includes('c-')) {
      counter = counter + 1;
    }
  }
  return counter;
}

/**
 * Get the number of clusterings - the how many c- are in the csv
 * @param {String} feature
 * @return {Number} integer
 */
export function getFeatureExtent(feature) {
  if (!(feature in featureExtents)) {
    featureExtents[feature] = d3.extent(data, function (d) {
      return d[feature];
    });
  }

  return featureExtents[feature];
}
