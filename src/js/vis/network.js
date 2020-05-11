/* global d3, $ */

/**
 * Draw functionality for the dynamic network in the move tank
 * @author Eren Cakmak eren.cakmak@uni-konstanz.de
 */

import { getFeatureExtent } from '../data.js';

/**
 * Draw the dynamic network in the movement environment aka move tank
 * @constructor
 */
export class DynamicNetwork {
  /**
   * Constructor for the level class
   * @param {Object} moveTank svg group to add the network
   * @param {Array} data the visualized data
   * @param {Number} numClusters max number of clusters
   */
  constructor(moveTank, data, numClusters) {
    // svg group
    this._g = moveTank.svg;
    this._gLinks = this._g.append('g').attr('id', 'network-links-group');
    this._xScale = moveTank.xScale;
    this._yScale = moveTank.yScale;
    this._data = data;
    // define the color scale based on min max of the filter slider
    const max = $('#filter-links-slider').attr('max');
    this._max = max;
    const range = Array.from(Array(10).keys()).map(function (d) {
      return d * (max / 11);
    });
    this._colorScale = d3
      .scaleThreshold()
      .domain(range)
      .range([
        '#f7fbff',
        '#deebf7',
        '#c6dbef',
        '#9ecae1',
        '#6baed6',
        '#4292c6',
        '#2171b5',
        '#08519c',
        '#08306b',
      ]);
    this._animalScale = 10;
    // color scale for the clustering
    this._clusterColorScale = d3.scaleOrdinal(
      d3.range(numClusters),
      d3.schemeTableau10
    );
  }

  /**
   * Draw the dynamic network
   * @param {Number} time actual time moment
   */
  draw(time) {
    const that = this;
    // get the data
    const data = this._data[time];
    // get the filter value
    const filterLinks = parseFloat($('#filter-links-slider').val());
    // coloring of the nodes by features
    const activeScale = $('input[name="radio-features"]:checked').attr('value');
    const featureColorScale = d3
      .scaleLinear()
      .range([
        '#2166ac',
        '#4393c3',
        '#92c5de',
        '#d1e5f0',
        '#f7f7f7',
        '#fddbc7',
        '#f4a582',
        '#d6604d',
        '#b2182b',
      ]);
    if (activeScale !== 'black') {
      // once the fill for the heads and the stroke for the path
      const featureExtent = getFeatureExtent(activeScale);
      const range = d3.range(
        featureExtent[0],
        featureExtent[1],
        (featureExtent[1] - featureExtent[0]) / 9
      );
      featureColorScale.domain(range);
    }

    // animal ids - required for the network data generation
    const animals = {};
    data.forEach(function (d) {
      animals[d['animal_id']] = [d['x'], d['y']];
    });
    const ids = Object.keys(animals);

    const networkData = [];
    data.map(function (item) {
      ids.forEach(function (d) {
        if (d === item['animal_id'] || that._max - item[d] < filterLinks) {
          return;
        }
        networkData.push({
          node1: item['animal_id'],
          node2: d,
          start: animals[item['animal_id']],
          end: animals[d],
          val: that._max - item[d],
        });
      });
    });

    // clustering stuff
    const clusterBool = $('#cluster-checkbox').is(':checked');
    const clusterKey = 'c-' + $('#cluster-slider').attr('dist');

    // draw network
    const networkVis = this._gLinks.selectAll('line').data(networkData);

    // UPDATE
    networkVis
      .attr('x1', function (d) {
        return that._xScale(d['start'][0]);
      })
      .attr('y1', function (d) {
        return that._yScale(d['start'][1]);
      })
      .attr('x2', function (d) {
        return that._xScale(d['end'][0]);
      })
      .attr('y2', function (d) {
        return that._yScale(d['end'][1]);
      })
      .attr('stroke', function (d) {
        return that._colorScale(d['val']);
      });

    // ENTER
    networkVis
      .enter()
      .append('line')
      .attr('class', function (d) {
        return 'link ' + d['node1'] + ' ' + d['node2'];
      })
      .attr('x1', function (d) {
        return that._xScale(d['start'][0]);
      })
      .attr('y1', function (d) {
        return that._yScale(d['start'][1]);
      })
      .attr('x2', function (d) {
        return that._xScale(d['end'][0]);
      })
      .attr('y2', function (d) {
        return that._yScale(d['end'][1]);
      })
      .attr('stroke', function (d) {
        return that._colorScale(d['val']);
      });

    networkVis.exit().remove();

    // draw the moving animals
    // Select
    const svgAnimals = this._g.selectAll('g.animal').data(data);

    // ENTER - append the animal groups
    const animalGroupings = svgAnimals
      .enter()
      .append('g')
      .attr('class', function (d) {
        return 'animal ' + d['animal_id'];
      })
      .attr('id', function (d) {
        return 'animal-' + d['animal_id'];
      })
      .attr('transform', function (d) {
        return (
          'translate(' +
          that._xScale(d['x']) +
          ', ' +
          that._yScale(d['y']) +
          ')'
        );
      });

    // Append the circles for each animal to the animalgroup
    animalGroupings
      .append('circle')
      .attr('r', this._animalScale)
      .attr('class', function (d) {
        return d['animal_id'];
      });
    // append the arrow
    animalGroupings
      .append('svg:defs')
      .append('svg:marker')
      .attr('id', function (d) {
        return 'arrow-marker-' + d['animal_id'];
      })
      .attr('refX', 2)
      .attr('refY', 6)
      .attr('markerWidth', 13)
      .attr('markerHeight', 13)
      .attr('orient', 'auto')
      .append('svg:path')
      .attr('d', 'M2,2 L2,11 L10,6 L2,2');

    // line for the arrow
    animalGroupings
      .append('line')
      .attr('class', 'arrow')
      .attr('marker-end', function (d) {
        return 'url(#arrow-marker-' + d['animal_id'] + ')';
      })
      .attr('x1', 0)
      .attr('y1', 0)
      .attr('x2', this._animalScale + 1)
      .attr('y2', 0)
      .attr('transform', function (d) {
        return 'rotate(' + d['direction'] + ')';
      });

    svgAnimals.select('.arrow').attr('transform', function (d) {
      return 'rotate(' + d['direction'] + ')';
    });

    // UPDATE - animals circles
    svgAnimals
      .attr('transform', function (d) {
        return (
          'translate(' +
          that._xScale(d['x']) +
          ', ' +
          that._yScale(d['y']) +
          ')'
        );
      })
      .each(function (d) {
        if (clusterBool) {
          d3.select(this)
            .select('circle')
            .attr('fill', function (d) {
              // if outlier use distinct color
              if (d[clusterKey] < 0) {
                return '#000';
              }
              return that._clusterColorScale(d[clusterKey]);
            });
        } else {
          d3.select(this).select('circle').attr('fill', '#000');
        }
      })
      .on('mouseover', function (d) {
        that._g.selectAll('*').classed('faded', true);
        that._g.selectAll('.' + d['animal_id']).classed('highlighted', true);

        // add tooltip
        d3.select('#tooltip-vis')
          .html('The mover belongs <br>to the cluster: ' + d[clusterKey])
          .style('display', 'inline-block')
          .style('top', d3.event.pageY - 150 + 'px')
          .style('left', d3.event.pageX - 200 + 'px');
      })
      .on('mouseout', function (d) {
        that._g.selectAll('*').classed('faded', false);
        that._g.selectAll('*').classed('highlighted', false);

        // remove tooltip
        d3.select('#tooltip-vis').style('display', 'none');
      });

    if (activeScale !== 'black') {
      // Update color of features
      svgAnimals.select('circle').attr('fill', function (d) {
        return featureColorScale(d[activeScale]);
      });
    }

    // EXIT - the groups
    svgAnimals.exit().remove();
  }
}
