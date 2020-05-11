/* global d3, $*/

/**
 * Draw functionality for the glyph design 1 in the move tank
 * @author Eren Cakmak eren.cakmak@uni-konstanz.de
 */
import { angle } from '../utils.js';
import { getFeatureExtent } from '../data.js';

/**
 * Draw the glyph design 1 in the movement environment aka move tank
 * @constructor
 */
export class Glyph {
  /**
   * Constructor for the level class
   * @param {Object} moveTank svg group to add the network
   * @param {Array} data the visualized data
   */
  constructor(moveTank, data) {
    // svg group
    this._g = moveTank.svg;
    this._xScale = moveTank.xScale;
    this._yScale = moveTank.yScale;
    this._data = data;
    // define a group for the mouse over links
    this._mouseoverG = this._g.append('g').attr('class', 'mouseover-group');
    // define the color scale based on min max of the filter slider
    const max = $('#filter-links-slider').attr('max');
    this._max = max;
    const range = d3.range(0, max, max / 9);

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

    this._activeScale = 'black';

    // inner circle of one animal
    this._animalScale = 3;
    // distance to the first outer ring of a single animal
    this._outerRing = 10;
    // distance for the outer ring cluster for the arcs
    this._outerRingCluster = 8;
    // arc generator
    this._arcGenerator = d3
      .arc()
      .innerRadius(this._animalScale)
      .outerRadius(this._outerRing);
    // arc width
    this._arcwidth = 0.2; // default value
    // linear scale for the cluster size
    const key = Object.keys(data)[0];
    const numberAnimals = data[key] ? data[key].length : data[0].length;
    this._clusterScale = d3
      .scaleLinear()
      .domain([1, numberAnimals])
      .range([this._outerRing, this._outerRing * this._animalScale]);
    // inner network node size
    this._nodeSize = 1.5; // node size of the cluster nodes
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
    // update the arc width stuff
    this._arcwidth = parseFloat(
      $('input[name="radio-arc"]:checked').attr('value')
    );
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
    // define the transition
    const t = d3.transition().duration(50).ease(d3.easeLinear);

    // aggregation function
    const binGenerator = d3
      .histogram()
      .value(function (d) {
        return d['arc'];
      })
      .domain([-Math.PI / 2, 1.5 * Math.PI])
      .thresholds(d3.range(-Math.PI / 2, 1.5 * Math.PI, this._arcwidth));

    // animal ids - required for the network data generation
    const animals = {};
    data.forEach(function (d) {
      animals[d['animal_id']] = [d['x'], d['y']];
    });
    const ids = Object.keys(animals);

    // clustering stuff
    const clusterBool = $('#cluster-checkbox').is(':checked');
    const clusterKey = 'c-' + $('#cluster-slider').attr('dist');

    // check if clustering is active
    // draw without abstraction
    if (!clusterBool) {
      // remove the clusters drawn
      this._g.selectAll('g.cluster').remove();

      const arcData = [];
      data.map(function (item) {
        ids.forEach(function (d) {
          if (d === item['animal_id'] || that._max - item[d] < filterLinks) {
            return;
          }
          const degree = angle(
            animals[item['animal_id']][0],
            animals[item['animal_id']][1],
            animals[d][0],
            animals[d][1]
          );
          arcData.push({
            node: item['animal_id'],
            pos: animals[item['animal_id']],
            arc: degree,
            val: that._max - item[d],
          });
        });
      });

      const groupedArcData = arcData.reduce(function (r, a) {
        r[a['node']] = r[a['node']] || [];
        r[a['node']].push(a);
        return r;
      }, Object.create(null));

      // binning the arcs to reduce the overall number of drawn arcs
      for (const key in groupedArcData) {
        if (groupedArcData[key]) {
          // bin the stuff
          groupedArcData[key] = binGenerator(groupedArcData[key]);

          // aggregate the array of objects again to just objects
          groupedArcData[key] = groupedArcData[key]
            .map(function (arr) {
              // if there are some elements in the bin
              // aggregate the stuff into one element
              if (arr.length) {
                const id = arr[0]['node'];
                const pos = [];
                arr.forEach(function (d) {
                  pos.push(d['pos']);
                });
                const value = d3.median(arr, function (d) {
                  return d['val'];
                });
                const arc = arr['x0'] + (arr['x1'] - arr['x0']) / 2;

                return { node: id, pos: pos, arc: arc, val: value };
              }
            })
            .filter(Boolean);
        }
      }

      // draw the moving animals
      const animalsUpdate = this._g.selectAll('g.animal').data(data);

      // exit - remove groups
      animalsUpdate.exit().remove();

      // ENTER - append the animal groups
      const animalsEnter = animalsUpdate
        .enter()
        .append('g')
        .attr('class', function (d) {
          return 'animal ' + d['animal_id'];
        });

      // Append the circles for each the outer circle
      animalsEnter
        .append('circle')
        .attr('class', function (d) {
          return 'outer-circle ' + d['animal_id'];
        })
        .attr('r', this._outerRing)
        .attr('fill', '#fff');

      // Append the inner circle circles for each the outer circle
      animalsEnter
        .append('circle')
        .attr('r', this._animalScale)
        .attr('class', function (d) {
          return 'inner-circle ' + d['animal_id'];
        });

      animalsEnter
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

      animalsEnter
        .append('line')
        .attr('class', 'arrow')
        .attr('marker-end', function (d) {
          return 'url(#arrow-marker-' + d['animal_id'] + ')';
        })
        .attr('x1', 0)
        .attr('y1', 0)
        .attr('x2', that._outerRing + 1)
        .attr('y2', 0);

      //  UPDATE MERGE
      const animalsEnterUpdate = animalsEnter.merge(animalsUpdate);

      animalsEnterUpdate.select('.inner-circle').attr('fill', function (d) {
        if (activeScale === 'black') {
          return '#000';
        }
        return featureColorScale(d[activeScale]);
      });

      animalsEnterUpdate.select('.arrow').attr('transform', function (d) {
        return 'rotate(' + d['direction'] + ')';
      });

      animalsEnterUpdate
        .attr('transform', function (d) {
          return (
            'translate(' +
            that._xScale(d['x']) +
            ', ' +
            that._yScale(d['y']) +
            ')'
          );
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

          // add links to the mouse over group
          const linkData = [];
          ids.forEach(function (item) {
            if (item === d['animal_id'] || that._max - d[item] < filterLinks) {
              return;
            }
            linkData.push({
              node1: d['animal_id'],
              node2: item,
              start: animals[d['animal_id']],
              end: animals[item],
              val: that._max - d[item],
            });
          });

          // Select and JOIN
          const networkVis = that._mouseoverG.selectAll('line').data(linkData);
          // ENTER
          networkVis
            .enter()
            .append('line')
            .merge(networkVis)
            .attr('class', 'link mouseover-line highlighted')
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
        })
        .on('mousemove', function (d) {
          // add tooltip
          d3.select('#tooltip-vis')
            .html('The mover belongs <br>to the cluster: ' + d[clusterKey])
            .style('display', 'inline-block')
            .style('top', d3.event.pageY - 150 + 'px')
            .style('left', d3.event.pageX - 200 + 'px');

          // add links to the mouse over group
          const linkData = [];
          ids.forEach(function (item) {
            if (item === d['animal_id'] || that._max - d[item] < filterLinks) {
              return;
            }
            linkData.push({
              node1: d['animal_id'],
              node2: item,
              start: animals[d['animal_id']],
              end: animals[item],
              val: that._max - d[item],
            });
          });

          // Select and JOIN
          const networkVis = that._mouseoverG.selectAll('line').data(linkData);
          // ENTER
          networkVis
            .enter()
            .append('line')
            .merge(networkVis)
            .attr('class', 'link mouseover-line highlighted')
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
        })
        .on('mouseout', function (d) {
          that._g.selectAll('*').classed('faded', false);
          that._g.selectAll('*').classed('highlighted', false);

          // remove tooltip
          d3.select('#tooltip-vis').style('display', 'none');

          // remove links
          that._mouseoverG.selectAll('line').remove();
        });

      // DRAW the glyph paths
      const arcVis = animalsUpdate.selectAll('.arc-paths').data(function (d) {
        return groupedArcData[d['animal_id']]
          ? groupedArcData[d['animal_id']]
          : [];
      });
      // ENTER
      arcVis
        .enter()
        .append('path')
        .merge(arcVis)
        .attr('class', function (d) {
          return 'arc-paths ' + d['animal_id'];
        })
        .attr('d', function (d) {
          return that._arcGenerator({
            startAngle: d['arc'] - that._arcwidth / 2,
            endAngle: d['arc'] + that._arcwidth / 2,
          });
        })
        .attr('fill', function (d) {
          return that._colorScale(d['val']);
        });

      arcVis.exit().remove();
    } else {
      // THE CLUSTERING CASE
      this._g.selectAll('g.animal').remove();
      // draw with clustering
      let clusterData = {};
      // group by clustering
      data.forEach(function (d) {
        if (!(d[clusterKey] in clusterData)) {
          clusterData[d[clusterKey]] = [d];
        } else {
          clusterData[d[clusterKey]].push(d);
        }
      });

      // abstract the elements
      clusterData = Object.values(clusterData).map(function (d) {
        if (d.length > 1 && d[0][clusterKey] >= 0) {
          // get cluster id
          const clusterID = d[0][clusterKey];
          // compute x and y mean of the group
          const x =
            d.reduce(function (sum, curr) {
              return sum + curr['x'];
            }, 0) / (d.length || 1);

          const y =
            d.reduce(function (sum, curr) {
              return sum + curr['y'];
            }, 0) / (d.length || 1);
          const moversIds = d.map(function (item) {
            return item['animal_id'];
          });
          // change the animals mapping
          d.forEach(function (item) {
            animals[item['animal_id']] = [x, y];
          });

          // average speed and average acceleration
          const avgSpeed =
            d.reduce(function (sum, curr) {
              return sum + curr['average_speed'];
            }, 0) / (d.length || 1);

          const avgAcc =
            d.reduce(function (sum, curr) {
              return sum + curr['average_acceleration'];
            }, 0) / (d.length || 1);

          const dir =
            d.reduce(function (sum, curr) {
              return sum + curr['direction'];
            }, 0) / (d.length || 1);

          // return as object
          return {
            'cluster-id': 'c-' + clusterID,
            x: x,
            y: y,
            average_speed: avgSpeed,
            average_acceleration: avgAcc,
            direction: dir,
            num: d.length,
            movers: d,
            'movers-id': moversIds,
          };
        } else {
          // check for outlier class
          if (d[0][clusterKey] < 0) {
            return d;
          }
          return d[0];
        }
      });
      // 2d to 1d needed because of outlier class
      clusterData = [].concat(...clusterData);

      // arc stuff for the clusters
      const arcData = [];
      clusterData.map(function (item) {
        if (item['num']) {
          // cluster case
          item['movers'].map(function (elm) {
            ids.forEach(function (d) {
              if (
                d === elm['animal_id'] ||
                that._max - elm[d] < filterLinks ||
                item['movers-id'].includes(d)
              ) {
                return;
              }

              const degree = angle(
                animals[elm['animal_id']][0],
                animals[elm['animal_id']][1],
                animals[d][0],
                animals[d][1]
              );
              arcData.push({
                node: elm['animal_id'],
                pos: [item['x'], item['y']],
                arc: degree,
                val: that._max - elm[d],
                'cluster-id': item['cluster-id'],
                num: item['num'], // required for arc scaling
              });
            });
          });
        } else {
          // normal animal not cluster
          ids.forEach(function (d) {
            if (d === item['animal_id'] || that._max - item[d] < filterLinks) {
              return;
            }
            const degree = angle(
              animals[item['animal_id']][0],
              animals[item['animal_id']][1],
              animals[d][0],
              animals[d][1]
            );
            arcData.push({
              node: item['animal_id'],
              pos: animals[item['animal_id']],
              arc: degree,
              val: that._max - item[d],
            });
          });
        }
      });

      const groupedArcData = arcData.reduce(function (r, a) {
        if (a['cluster-id']) {
          r[a['cluster-id']] = r[a['cluster-id']] || [];
          r[a['cluster-id']].push(a);
          return r;
        }
        r[a['node']] = r[a['node']] || [];
        r[a['node']].push(a);
        return r;
      }, Object.create(null));

      // binning the arcs to reduce the overall number of drawn arcs
      for (const key in groupedArcData) {
        if (groupedArcData[key]) {
          // bin the stuff
          groupedArcData[key] = binGenerator(groupedArcData[key]);
          // aggregate the array of objects again to just objects
          groupedArcData[key] = groupedArcData[key]
            .map(function (arr) {
              // if there are some elements in the bin
              // aggregate the stuff into one element
              if (arr.length) {
                const id = arr[0]['node'];
                const pos = [];
                arr.forEach(function (d) {
                  pos.push(d['pos']);
                });
                const value = d3.median(arr, function (d) {
                  return d['val'];
                });
                const arc = arr['x0'] + (arr['x1'] - arr['x0']) / 2;

                if ('cluster-id' in arr[0]) {
                  return {
                    node: id,
                    pos: pos,
                    arc: arc,
                    val: value,
                    'cluster-id': arr[0]['cluster-id'],
                    num: arr[0]['num'],
                  };
                }
                return { node: id, pos: pos, arc: arc, val: value };
              }
            })
            .filter(Boolean);
        }
      }

      // Draw cluster
      const clusterUpdate = this._g.selectAll('g.cluster').data(clusterData);

      // exit - remove groups
      clusterUpdate.exit().attr('fill', '#ce1256').transition(t).remove();

      // ENTER - append the animal groups
      const clusterEnter = clusterUpdate.enter().append('g');

      // append the outer-circle-cluster
      clusterEnter.append('circle').attr('class', function (d) {
        return d['num']
          ? 'outer-circle-cluster ' + d['cluster-id']
          : 'outer-circle-cluster ' + d['animal_id'];
      });

      clusterEnter
        .append('svg:defs')
        .append('svg:marker')
        .attr('id', function (d) {
          return d['num']
            ? 'arrow-marker-' + d['cluster-id']
            : 'arrow-marker-' + d['animal_id'];
        })
        .attr('refX', 2)
        .attr('refY', 6)
        .attr('markerWidth', 13)
        .attr('markerHeight', 13)
        .attr('orient', 'auto')
        .append('svg:path')
        .attr('d', 'M2,2 L2,11 L10,6 L2,2');

      clusterEnter
        .append('line')
        .attr('class', 'arrow')
        .attr('marker-end', function (d) {
          return d['num']
            ? 'url(#arrow-marker-' + d['cluster-id']
            : 'url(#arrow-marker-' + d['animal_id'];
        })
        .attr('x1', 0)
        .attr('y1', 0)
        .attr('x2', function (d) {
          if (d['num']) {
            return that._clusterScale(d['num']) + that._outerRingCluster;
          }
          return that._outerRing + 1;
        })
        .attr('y2', 0);

      // append the outer circle
      clusterEnter.append('circle').attr('class', function (d) {
        return d['num']
          ? 'outer-circle ' + d['cluster-id']
          : 'outer-circle ' + d['animal_id'];
      });

      // append the inner circle (core)
      clusterEnter
        .append('circle')
        .attr('r', this._animalScale)
        .attr('class', function (d) {
          return d['num']
            ? 'inner-circle ' + d['cluster-id']
            : 'inner-circle ' + d['animal_id'];
        })
        .attr('opacity', function (d) {
          return d['num'] ? 0 : 1;
        });

      // append the inner group for the nodes
      const networkGroup = clusterEnter.append('g').attr('class', function (d) {
        return d['num']
          ? 'network-group ' + d['cluster-id']
          : 'network-group ' + d['animal_id'];
      });
      networkGroup.append('g').attr('class', 'network-link-group');
      networkGroup.append('g').attr('class', 'network-node-group');

      // Update + Enter
      const clusterEnterUpdate = clusterEnter.merge(clusterUpdate);

      clusterEnterUpdate
        .select('.arrow')
        .attr('transform', function (d) {
          return 'rotate(' + d['direction'] + ')';
        })
        .attr('x2', function (d) {
          if (d['num']) {
            return that._clusterScale(d['num']) + that._outerRingCluster;
          }
          return that._outerRing + 1;
        });

      // Update group
      clusterEnterUpdate
        .attr('class', function (d) {
          return d['num']
            ? 'cluster ' + d['cluster-id']
            : 'cluster ' + d['animal_id'];
        })
        .attr('transform', function (d) {
          return (
            'translate(' +
            that._xScale(d['x']) +
            ', ' +
            that._yScale(d['y']) +
            ')'
          );
        })
        .on('mouseover', function (d) {
          that._g.selectAll('*').classed('faded', true);

          if (typeof d['cluster-id'] !== 'undefined') {
            that._g
              .selectAll('.' + d['cluster-id'])
              .classed('highlighted', true);

            that._g
              .selectAll('.network-group.' + d['cluster-id'] + ' *')
              .classed('highlighted', true);

            // add tooltip
            d3.select('#tooltip-vis')
              .html('The cluster consits of: <br> ' + d['num'] + ' movers')
              .style('display', 'inline-block')
              .style('top', d3.event.pageY - 150 + 'px')
              .style('left', d3.event.pageX - 200 + 'px');

            // add links to the mouse over group
          } else {
            that._g
              .selectAll('.' + d['animal_id'])
              .classed('highlighted', true);

            // add tooltip
            d3.select('#tooltip-vis')
              .html('The mover belongs <br>to the cluster: ' + d[clusterKey])
              .style('display', 'inline-block')
              .style('top', d3.event.pageY - 150 + 'px')
              .style('left', d3.event.pageX - 200 + 'px');
          }
          // mouse over stuff for the links
          const linkData = [];
          if (d['num']) {
            d['movers'].forEach(function (elm) {
              ids.forEach(function (item) {
                if (
                  item === elm['animal_id'] ||
                  that._max - elm[item] < filterLinks ||
                  d['movers-id'].includes(item['animal_id'])
                ) {
                  return;
                }
                linkData.push({
                  node1: d['cluster-id'],
                  node2: item,
                  start: [d['x'], d['y']],
                  end: animals[item],
                  val: that._max - elm[item],
                });
              });
            });
          } else {
            ids.forEach(function (item) {
              if (
                item === d['animal_id'] ||
                that._max - d[item] < filterLinks
              ) {
                return;
              }
              linkData.push({
                node1: d['animal_id'],
                node2: item,
                start: animals[d['animal_id']],
                end: animals[item],
                val: that._max - d[item],
              });
            });
          }

          // Select and JOIN
          const networkVis = that._mouseoverG.selectAll('line').data(linkData);
          // ENTER
          networkVis
            .enter()
            .append('line')
            .merge(networkVis)
            .attr('class', 'link mouseover-line highlighted')
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
        })
        .on('mousemove', function (d) {
          // mouse over stuff for the links
          const linkData = [];
          if (d['num']) {
            d['movers'].forEach(function (elm) {
              ids.forEach(function (item) {
                if (
                  item === elm['animal_id'] ||
                  that._max - elm[item] < filterLinks ||
                  d['movers-id'].includes(item['animal_id'])
                ) {
                  return;
                }
                linkData.push({
                  node1: d['cluster-id'],
                  node2: item,
                  start: [d['x'], d['y']],
                  end: animals[item],
                  val: that._max - elm[item],
                });
              });
            });
          } else {
            ids.forEach(function (item) {
              if (
                item === d['animal_id'] ||
                that._max - d[item] < filterLinks
              ) {
                return;
              }
              linkData.push({
                node1: d['animal_id'],
                node2: item,
                start: animals[d['animal_id']],
                end: animals[item],
                val: that._max - d[item],
              });
            });
          }

          // Select and JOIN
          const networkVis = that._mouseoverG.selectAll('line').data(linkData);
          // ENTER
          networkVis
            .enter()
            .append('line')
            .merge(networkVis)
            .attr('class', 'link mouseover-line highlighted')
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
        })
        .on('mouseout', function (d) {
          that._g.selectAll('*').classed('faded', false);
          that._g.selectAll('*').classed('highlighted', false);

          // remove tooltip
          d3.select('#tooltip-vis').style('display', 'none');

          // remove links
          that._mouseoverG.selectAll('line').remove();
        });

      // Update outer circle
      clusterEnterUpdate
        .select('.outer-circle-cluster')
        .attr('class', function (d) {
          return d['num']
            ? 'outer-circle-cluster ' + d['cluster-id']
            : 'outer-circle-cluster ' + d['animal_id'];
        })
        .attr('opacity', function (d) {
          return d['num'] ? 1 : 0;
        })
        .attr('r', function (d) {
          if (d['num']) {
            return that._clusterScale(d['num']) + that._outerRingCluster;
          }
          return that._clusterScale(1) + that._outerRingCluster;
        });
      // ADD HERE t;

      // Update the outer circle
      clusterEnterUpdate
        .select('.outer-circle')
        .attr('class', function (d) {
          return d['num']
            ? 'outer-circle ' + d['cluster-id']
            : 'outer-circle ' + d['animal_id'];
        })
        .attr('r', function (d) {
          if (d['num']) {
            return that._clusterScale(d['num']);
          }
          return that._clusterScale(1);
        })
        .attr('fill', function (d) {
          if (d['num'] && activeScale !== 'black') {
            return featureColorScale(d[activeScale]);
          }
          return '#fff';
        });

      // Update the inner circle
      clusterEnterUpdate
        .select('.inner-circle')
        .attr('class', function (d) {
          return d['num']
            ? 'inner-circle ' + d['cluster-id']
            : 'inner-circle ' + d['animal_id'];
        })
        .attr('opacity', function (d) {
          return d['num'] ? 0 : 1;
        })
        .attr('fill', function (d) {
          if (activeScale === 'black') {
            return '#000';
          }
          return featureColorScale(d[activeScale]);
        });

      // Update the inner group for the network
      // needed for highlighing
      clusterEnterUpdate.select('.network-group').attr('class', function (d) {
        return d['num']
          ? 'network-group ' + d['cluster-id']
          : 'network-group ' + d['animal_id'];
      });

      // DRAW the glyph paths
      const arcVis = clusterUpdate.selectAll('.arc-paths').data(function (d) {
        if (d['num'] && typeof d['cluster-id'] !== 'undefined') {
          return groupedArcData[d['cluster-id']]
            ? groupedArcData[d['cluster-id']]
            : [];
        }
        return groupedArcData[d['animal_id']]
          ? groupedArcData[d['animal_id']]
          : [];
      });
      // ENTER
      arcVis
        .enter()
        .append('path')
        .merge(arcVis)
        .attr('class', function (d) {
          return 'arc-paths';
        })
        .attr('d', function (d) {
          if (typeof d['cluster-id'] !== 'undefined') {
            const arc = d3
              .arc()
              .innerRadius(that._clusterScale(d['num']))
              .outerRadius(
                that._clusterScale(d['num']) + that._outerRingCluster
              );
            return arc({
              startAngle: d['arc'] - that._arcwidth / 2,
              endAngle: d['arc'] + that._arcwidth / 2,
            });
          }
          return that._arcGenerator({
            startAngle: d['arc'] - that._arcwidth / 2,
            endAngle: d['arc'] + that._arcwidth / 2,
          });
        })
        .attr('fill', function (d) {
          return that._colorScale(d['val']);
        });

      arcVis.exit().remove();

      // append links
      // SELECT and Join links
      const clusterLinks = clusterEnterUpdate
        .select('.network-group')
        .select('.network-link-group')
        .selectAll('.link')
        .data(function (d) {
          if (!('cluster-id' in d && typeof d['cluster-id'] !== 'undefined')) {
            return [];
          }
          const movers = d['movers'];
          // size of the circle
          const depth = that._clusterScale(d['num']);
          // compute scale needed for scaling in the circle
          // (e.g. node positions)
          const maxDistance = d3.max(
            movers.map(function (target) {
              const x = target['x'] - d['x'];
              const y = target['y'] - d['y'];
              return Math.sqrt(x * x + y * y);
            })
          );
          // positions of the movers
          const animalsCluster = {};
          movers.forEach(function (target) {
            // degree between centroid of the cluster and the point
            const degree = angle(d['x'], d['y'], target['x'], target['y']);
            // distance between centroid of the cluster and the point
            const dist = Math.sqrt(
              Math.pow(target['x'] - d['x'], 2) +
                Math.pow(target['y'] - d['y'], 2)
            );
            // compute hypotenuse
            const hyp = ((depth - that._nodeSize) * dist) / maxDistance;
            // pythagoras theorem
            const x = Math.sin(degree) * hyp;
            // minus since graph is upwards
            const y = -Math.cos(degree) * hyp;
            animalsCluster[target['animal_id']] = [x, y];
          });

          // compute the network links
          const networkData = [];
          movers.map(function (source) {
            // iterate again over the movers in the cluster
            Object.keys(animalsCluster).forEach(function (target) {
              // filter if below filter values
              if (
                target === source['animal_id'] ||
                that._max - source[target] < filterLinks
              ) {
                return;
              }
              // edge
              networkData.push({
                node1: source['animal_id'],
                node2: target,
                start: animalsCluster[source['animal_id']],
                end: animalsCluster[target],
                val: that._max - source[target],
              });
            });
          });
          // return the links
          return networkData;
        });

      // ENTER AND MERGE of nodes
      clusterLinks
        .enter()
        .append('line')
        .merge(clusterLinks)
        .attr('class', function (d) {
          return 'link ' + d['node1'] + ' ' + d['node2'];
        })
        .attr('x1', function (d) {
          return d['start'][0];
        })
        .attr('y1', function (d) {
          return d['start'][1];
        })
        .attr('x2', function (d) {
          return d['end'][0];
        })
        .attr('y2', function (d) {
          return d['end'][1];
        })
        .attr('stroke', function (d) {
          return that._colorScale(d['val']);
        });

      clusterLinks.exit().remove();

      // SELECT and Join nodes
      const clusterNodes = clusterEnterUpdate
        .select('.network-group')
        .select('.network-node-group')
        .selectAll('.node-cluster')
        .data(function (d) {
          if (!('cluster-id' in d && typeof d['cluster-id'] !== 'undefined')) {
            return [];
          }
          // size of the circle
          const depth = that._clusterScale(d['num']);
          // compute scale needed for scaling in the circle
          // (e.g. node positions)
          const maxDistance = d3.max(
            d['movers'].map(function (target) {
              const x = target['x'] - d['x'];
              const y = target['y'] - d['y'];
              return Math.sqrt(x * x + y * y);
            })
          );
          // return the movers
          return d['movers'].map(function (target) {
            // degree between centroid of the cluster and the point
            const degree = angle(d['x'], d['y'], target['x'], target['y']);
            // distance between centroid of the cluster and the point
            const dist = Math.sqrt(
              Math.pow(target['x'] - d['x'], 2) +
                Math.pow(target['y'] - d['y'], 2)
            );
            // compute hypotenuse
            const hyp = ((depth - that._nodeSize) * dist) / maxDistance;
            // pythagoras theorem
            const x = Math.sin(degree) * hyp;
            // minus since graph is upwards
            const y = -Math.cos(degree) * hyp;
            return {
              x: x,
              y: y,
              average_speed: target['average_speed'],
              average_acceleration: target['average_acceleration'],
            };
          });
        });

      // ENTER AND MERGE of nodes
      clusterNodes
        .enter()
        .append('circle')
        .attr('r', this._nodeSize)
        .attr('class', 'node-cluster')
        .merge(clusterNodes)
        .attr('cx', function (d) {
          return d['x'];
        })
        .attr('cy', function (d) {
          return d['y'];
        })
        .attr('fill', function (d) {
          if (activeScale === 'black') {
            return '#000';
          }
          return featureColorScale(d[activeScale]);
        });

      clusterNodes.exit().attr('fill', '#ce1256').transition(t).remove();
    }
  }
}
