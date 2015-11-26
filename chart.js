(function(root, factory) {
  'use strict';

  if (typeof module !== 'undefined' && module.exports) {
    var d3 = require('d3');
    window.d3 = d3;
    module.exports = factory(d3);
  } else {
    root.ClimateChart = factory(root.d3);
  }
}(this, function(d3) {
  'use strict';

  ///////////////////////
  // default settings  //
  ///////////////////////

  var _locale = 'en';
  var _colors = {
    red: '#dc0000'
  };

  ///////////////////////
  // private functions //
  ///////////////////////

  function _formatNumber(value) {
    return new Intl.NumberFormat(_locale).format(value);
  }

  function _parseData(data, o) {
    data.forEach(function(d) {
      d[o.xAccessor] = parseFloat(d[o.xAccessor]);
      d[o.yAccessor] = parseFloat(d[o.yAccessor]);
      d[o.sizeAccessor] = parseFloat(d[o.sizeAccessor]);
    });

    data = data.filter(function(d) {
      return !isNaN(d[o.xAccessor]) && !isNaN(d[o.yAccessor]) && !isNaN(d[o.sizeAccessor]);
    });

    return data;
  }

  function _merge() {
    var obj = {};
    var key;

    for (var i = 0; i < arguments.length; i++) {
      for (key in arguments[i]) {
        if (arguments[i].hasOwnProperty(key)) {
          obj[key] = arguments[i][key];
        }
      }
    }

    return obj;
  }

  /////////////////////
  // tooltip factory //
  /////////////////////

  var Tooltip = function() {

    var tooltip, top, left, headEl, dataEl, bodyEl, chartWidth, dataItems;

    function create(parent, _chartWidth, _dataItems) {
      chartWidth = _chartWidth;
      dataItems = _dataItems;
      tooltip = parent.append('div').classed('climate-factions__tooltip', true);
      headEl = tooltip.append('div').classed('climate-factions__tooltip-head', true);
      bodyEl = tooltip.append('div').classed('climate-factions__tooltip-body', true);
      dataEl = bodyEl.append('dl').classed('climate-factions__tooltip-data', true);
      return this;
    }

    function update(data) {
      headEl.text(data.countryname_en);
      dataEl.selectAll('*').remove();
      for (var key in dataItems) {
        if (dataItems.hasOwnProperty(key)) {
          var value = data[key] ? data[key] : '-';
          var formattedValue = isNaN(value) ? value : _formatNumber(value);
          dataEl.append('dt').text(dataItems[key]);
          dataEl.append('dd').text(formattedValue);
        }
      }
    }

    function updatePosition(coords) {
      top = coords[1] - 50;
      left = coords[0] > (chartWidth / 2) ? coords[0] - 210 : coords[0] + 10;

      tooltip.style({
        top: top + 'px',
        left: left + 'px'
      });
    }

    function hide() {
      tooltip.style('display', 'none');
    }

    function show() {
      tooltip.style('display', 'block');
    }

    return {
      create: create,
      update: update,
      updatePosition: updatePosition,
      show: show,
      hide: hide
    };
  };

  ///////////////////
  // chart factory //
  ///////////////////

  return function(_selector, _options) {

    if (typeof _selector === 'undefined') {
        throw new Error('You need to specify a selector.');
    }

    if (typeof _options === 'undefined' || !_options.path) {
        throw new Error('You need to specify options: path');
    }

    var optionsDefault = {
        xAccessor: 'gdp_2014',
        yAccessor: 'co2_t_pc_2012',
        sizeAccessor: 'population_2014',
        xAxisDivisor: 1,
        yAxisDivisor: 1,
        colors: {
          A: '#005fcc',
          B: '#5c0000',
          C: '#009300',
          D: '#ea8500'
        },
        isLogScale: true,
        pointRange: [10, 1000],
        xTicks: 5,
        yTicks: 5,
        height: 400,
        lang: 'de',
        interactive: true,
        showLegend: false,
        margin: {
          top: 50,
          right: 50,
          bottom: 50,
          left: 50
        },
        filter: null,
        minRadius: 2,
        maxRadius: 30,
        maxWidth: 960,
        aspectRatio: .7,
        transitionDuration: 500,
        tooltipData: {},
        threshold: 0,
        thresholdDescription: ''
    };

    var svg,
        x,
        y,
        r,
        xAxis,
        yAxis,
        xExtent,
        yExtent,
        rExtent,
        yMax,
        parent,
        data,
        options,
        selector,
        bubbles,
        margin,
        width,
        height,
        tooltip = new Tooltip();

    function onMouseEnter(d) {
      if(d.node.datum().disabled) {
        return false;
      }
      tooltip.update(d.node.datum());
      tooltip.show();
      d.node.classed('active', true);
    }

    function onMouseMove() {
      tooltip.updatePosition(d3.mouse(parent.node()));
    }

    function onMouseLeave(d) {
      d.node.classed('active', false);
      tooltip.hide();
    }

    function initScales() {
      xExtent = d3.extent(data, function(d) { return d[options.xAccessor]; });
      yExtent = d3.extent(data, function(d) { return d[options.yAccessor]; });
      rExtent = d3.extent(data, function(d) { return d[options.sizeAccessor]; });

      if(options.isLogScale) {
        x = d3.scale.log().domain(xExtent).range([0, width]);
      }
      else {
        x = d3.scale.linear().domain(xExtent).range([0, width]);
      }

      y = d3.scale.linear().domain([-.5, yExtent[1]]).range([height, 0]);
      r = d3.scale.sqrt().domain(rExtent).range([options.minRadius, options.maxRadius]);
    }

    function initAxis() {
      xAxis = d3.svg.axis()
        .orient('bottom')
        .scale(x)
        .ticks(4, function(d) {
          return _formatNumber(d / options.xAxisDivisor);
        });

      yAxis = d3.svg.axis()
        .orient('left')
        .scale(y)
        .tickFormat(function(d) {
          return _formatNumber(d / options.yAxisDivisor);
        });
    }

    function updateDimensions(winWidth) {
      width = winWidth < options.maxWidth ? winWidth : options.maxWidth;
      width = width - margin.right - margin.left;
      height = width * options.aspectRatio;
    }

    function labelPositionLeft(d) {
      var xPos = x(d[options.xAccessor]);
      var center = width / 2;
      var offset = 35;
      return xPos < center ? xPos + offset : xPos - offset;
    }

    function createBubbles() {
      bubbles = svg.selectAll('circle.bubble')
        .data(data)
        .enter()
        .append('circle')
        .classed('bubble', true)
        .attr('cx', function(d) { return x(d[options.xAccessor]); })
        .attr('cy', function(d) { return y(d[options.yAccessor]); })
        .attr('r', function(d) { return r(d[options.sizeAccessor]); })
        .attr('fill', function(d) { return options.colors[d.fraction]; })
        .attr('stroke', function(d) { return options.colors[d.fraction]; });
    }

    function createLabels(labels) {

      svg.selectAll('line.line')
        .data(labels)
        .enter()
        .append('line')
        .classed('line', true)
        .attr('x1', function(d) { return x(d[options.xAccessor]); })
        .attr('y1', function(d) { return y(d[options.yAccessor]); })
        .attr('x2', labelPositionLeft)
        .attr('y2', function(d) { return y(d[options.yAccessor]); })
        .attr('stroke-width', 1)
        .attr('stroke', 'black');

      svg.selectAll('circle.dot')
        .data(labels)
        .enter()
        .append('circle')
        .classed('dot', true)
        .attr('cx', function(d) { return x(d[options.xAccessor]); })
        .attr('cy', function(d) { return y(d[options.yAccessor]); })
        .attr('r', 2)
        .attr('fill', 'black');

      parent.selectAll('div.label')
        .data(labels)
        .enter()
        .append('div')
        .classed('label', true)
        .classed('left', function(d) { return x(d[options.xAccessor]) > (width / 2); })
        .style('margin-top', margin.top - 5 + 'px')
        .style('margin-left', margin.left + 'px')
        .style('left', function(d) { return labelPositionLeft(d) + 'px'; })
        .style('top',  function(d) { return y(d[options.yAccessor]) + 'px'; })
        .style('display', 'block')
        .html(function(d) { return d.label_html || d.countryname_en; });
    }

    function createThresholdLine() {
      svg.append('line')
        .classed('threshold', true)
        .style('stroke', _colors.red)
        .style('stroke-dasharray', ('4, 4'))
        .style('stroke-width', 2)
        .attr('x1', 0)
        .attr('y1', y(options.threshold))
        .attr('x2', width)
        .attr('y2', y(options.threshold));

      svg.append('text')
        .classed('threshold-description', true)
        .attr('x', 10)
        .attr('y', y(options.threshold) - 10)
        .style('fill', _colors.red)
        .style('font-weight', 'bold')
        .text(options.thresholdDescription);
    }

    function createVoronoi() {
      var voro = d3.geom.voronoi()
        .clipExtent([[0, 0], [width, height]])
        .x(function(d) { return x(d[options.xAccessor]); })
        .y(function(d) { return y(d[options.yAccessor]); });

      this.select('.voronoi-overlay').remove();

      this.append('g')
        .classed('voronoi-overlay', true)
        .selectAll('path.voro')
        .data(voro(data))
        .enter()
        .append('path')
        .classed('voro', true)
        .attr('d', function(d) { return 'M' + d.join(',') + 'Z'; })
        .on('mouseenter', onMouseEnter)
        .on('mouseleave', onMouseLeave)
        .each(function(d) {
          d3.select(this)
            .datum()
            .node = bubbles.filter(function(b) {
              return b.countryname_en === d.point.countryname_en;
            });
        })
        .on('mousemove', onMouseMove);
    }

    function createAxis() {
      if(svg.selectAll('.climate-chart .x.axis')[0].length > 0) {
        this.selectAll('.x.axis')
          .transition()
          .duration(options.transitionDuration)
          .call(xAxis);

        return;
      }

      svg.selectAll('.climate-chart .y.axis').remove();

      this.append('g')
        .classed('y axis', true)
        .call(yAxis);

      this.append('g')
        .classed('x axis', true)
        .attr('transform', 'translate(0,' + height + ')')
        .call(xAxis);
    }

    function createAxisDescription() {
      svg.append('text')
        .attr('text-anchor', 'end')
        .attr('x', width)
        .attr('y', height + 35)
        .text(options.xAxisDescription || options.xAccessor);

      svg.append('text')
        .attr('text-anchor', 'end')
        .attr('y', 10)
        .attr('dy', '.75em')
        .attr('transform', 'rotate(-90)')
        .text(options.yAxisDescription || options.yAccessor);
    }

    function renderChart() {
      margin = options.margin;

      updateDimensions(window.innerWidth);
      parent = d3.select(selector);
      parent.node().innerHTML = '';

      parent = parent
        .append('div')
        .classed('climate-chart-wrapper', true);

      tooltip.create(parent, width, options.tooltipData);

      svg = parent
        .append('svg')
        .classed('climate-chart', true)
        .attr('width', width + margin.right + margin.left)
        .attr('height', height + margin.top + margin.bottom)
        .append('g')
        .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

      initScales();
      initAxis();

      svg.call(createAxis);
      svg.call(createAxisDescription);
      svg.call(createBubbles);
      svg.call(createThresholdLine);
      svg.call(createVoronoi);

      var labels = data.filter(function(d) {
        return d.labeled !== '';
      });

      createLabels(labels);
    }

    function bindEvents() {
      window.addEventListener('resize', function() {
        renderChart(_selector, options, data);
      });
    }

    function updateChart(isGroupFocus) {
      if(!isGroupFocus) {
        initScales();
      }

      svg.selectAll('circle.bubble')
        .transition()
        .duration(options.transitionDuration)
        .attr('cx', function(d) { return x(d[options.xAccessor]); })
        .attr('cy', function(d) { return y(d[options.yAccessor]); })
        .attr('r', function(d) { return r(d[options.sizeAccessor]); });

      svg.selectAll('text.label')
        .transition()
        .duration(options.transitionDuration)
        .attr('x', function(d) { return x(d[options.xAccessor]); })
        .attr('y', function(d) { return y(d[options.yAccessor]); });

      svg.call(createVoronoi);
    }

    function updateThreshold() {
      var yPos = y(options.threshold);

      svg.selectAll('line.threshold')
        .transition()
        .duration(options.transitionDuration)
        .attr('y1', yPos)
        .attr('y2', yPos);

      svg.selectAll('text.threshold-description')
        .transition()
        .duration(options.transitionDuration)
        .attr('y', yPos - 10);
    }

    function focusGroup(groupId) {
      //filter data
      var filteredData = data.filter(function(d) {
        return d.fraction === groupId;
      });

      // calculate new x-extent
      xExtent = d3.extent(filteredData, function(d) {
        return d[options.xAccessor];
      });

      yMax = d3.max(filteredData, function(d) {
        return d[options.yAccessor];
      });

      //set new domain for axes
      x.domain(xExtent);
      y.domain([0, yMax]);

      //animate x-axis to new extent
      svg.selectAll('.x.axis')
        .transition()
        .duration(options.transitionDuration)
        .call(xAxis);

      //animate x-axis to new extent
      svg.selectAll('.y.axis')
        .transition()
        .duration(options.transitionDuration)
        .call(yAxis);

      //highlight all circles in group
      svg.selectAll('circle.bubble')
        .style('opacity', .2)
        .each(function(d) { d.disabled = true; })
        .filter(function(d) { return d.fraction === groupId; })
        .style('opacity', 1)
        .each(function(d) { d.disabled = false; });

      parent.selectAll('div.label')
        .style('display', 'none')
        .filter(function(d) { return d.fraction === groupId; })
        .classed('left', function(d) { return x(d[options.xAccessor]) > (width / 2); })
        .style('display', 'block')
        .transition()
        .duration(options.transitionDuration)
        .style('top', function(d) { return y(d[options.yAccessor]) + 'px'; })
        .style('left', function(d) { return labelPositionLeft(d) + 'px'; });

      svg.selectAll('line.line')
        .style('display', 'none')
        .filter(function(d) { return d.fraction === groupId; })
        .style('display', 'block')
        .transition()
        .duration(options.transitionDuration)
        .attr('x1', function(d) { return x(d[options.xAccessor]); })
        .attr('y1', function(d) { return y(d[options.yAccessor]); })
        .attr('x2', labelPositionLeft)
        .attr('y2', function(d) { return y(d[options.yAccessor]); });

      svg.selectAll('circle.dot')
        .style('display', 'none')
        .filter(function(d) { return d.fraction === groupId; })
        .style('display', 'block')
        .transition()
        .duration(options.transitionDuration)
        .attr('cx', function(d) { return x(d[options.xAccessor]); })
        .attr('cy', function(d) { return y(d[options.yAccessor]); });

      updateThreshold();
      updateChart(true);
      svg.call(createVoronoi);
    }

    function updateLabels() {
      parent.selectAll('div.label')
        .style('display', 'block')
        .classed('left', function(d) { return x(d[options.xAccessor]) > (width / 2); })
        .transition()
        .duration(options.transitionDuration)
        .style('top', function(d) { return y(d[options.yAccessor]) + 'px'; })
        .style('left', function(d) { return labelPositionLeft(d) + 'px'; });

      svg.selectAll('line.line')
        .style('display', 'block')
        .transition()
        .duration(options.transitionDuration)
        .attr('x1', function(d) { return x(d[options.xAccessor]); })
        .attr('y1', function(d) { return y(d[options.yAccessor]); })
        .attr('x2', labelPositionLeft)
        .attr('y2', function(d) { return y(d[options.yAccessor]); });

      svg.selectAll('circle.dot')
        .style('display', 'block')
        .transition()
        .duration(options.transitionDuration)
        .attr('cx', function(d) { return x(d[options.xAccessor]); })
        .attr('cy', function(d) { return y(d[options.yAccessor]); });
    }

    function reset() {
      updateChart();
      updateThreshold();
      updateLabels();
      xAxis.scale(x);
      yAxis.scale(y);

      svg.call(createAxis);
      svg.call(createVoronoi);

      svg.selectAll('circle.bubble')
        .style('opacity', 1)
        .each(function(d) { d.disabled = false; });
    }

    function update(newOpts) {
      options = _merge(options, newOpts);
      updateChart();
      updateLabels();
      xAxis.scale(x);
      yAxis.scale(y);
      svg.call(createAxis);
    }

    _options = _merge(optionsDefault, _options);
    _locale = _options.locale || _locale;

    d3.csv(_options.path, function(err, csvData) {
      if(err) {
        throw new Error('Data not found.');
      }
      data = _parseData(csvData, _options);
      options = _options;
      selector = _selector;
      renderChart();
      bindEvents();
    });

    /////////////
    // exports //
    /////////////

    return {
      update: update,
      focusGroup: focusGroup,
      reset: reset
    };
  };

}));
