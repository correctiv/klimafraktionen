(function(root, factory) {
  if (typeof module !== 'undefined' && module.exports) {
      var d3 = require('d3');
      window.d3 = d3;
      module.exports = factory(d3);
  } else {
      root.ClimateChart = factory(root.d3);
  }
}(this, function(d3) {

  var svg, x, y, r, color, xAxis, yAxis, xExtent, yExtent, bubbleGroup, parent, globalData, globalOpts, globalSelector;

  var width = 960,
      height = 500,
      maxWidth = 960;

  var margin = {
    top: 50,
    right : 50,
    bottom : 50,
    left : 50
  }

  function bindEvents() {
    d3.select(window).on('resize', function() {
      renderChart(globalSelector, globalOpts, globalData);
    });
  }

  function updateDimensions(winWidth) {
    width = winWidth < maxWidth ? winWidth : maxWidth;
    width = width - margin.right - margin.left;
  }

  function renderChart(selector, options, data) {
    updateDimensions(window.innerWidth);
    parent = d3.select(selector);
    parent.node().innerHTML = '';
    console.log(width);
    console.log(options);

    svg = parent
      .append('svg')
      .classed('climate-chart', true)
      .attr('width', width + margin.right + margin.left)
      .attr('height', height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    xExtent = d3.extent(data, function(d,i) { return d[options.xAccessor] });
    yExtent = d3.extent(data, function(d,i) { return d[options.yAccessor] });
    rExtent = d3.extent(data, function(d,i) { return d[options.sizeAccessor] });

    x = d3.scale.log().domain(xExtent).range([0, width]);
    y = d3.scale.linear().domain(yExtent).range([height, 0]);
    r = d3.scale.sqrt().domain(rExtent).range([3,25]);
    color = d3.scale.ordinal().range(options.colors);

    xAxis = d3.svg.axis()
      .orient('bottom')
      .scale(x)
      .ticks(2, d3.format(",d"));

    yAxis = d3.svg.axis().orient('left').scale(y);

    svg.call(createAxis);

    svg.selectAll('circle.bubble')
      .data(data)
      .enter()
      .append('circle')
      .classed('bubble', true)
      .attr('cx', function(d,i) { return x(d[options.xAccessor]) })
      .attr('cy', function(d,i) { return y(d[options.yAccessor]) })
      .attr('r', function(d,i) { return r(d[options.sizeAccessor]) })
      .attr('fill', function(d,i) { return options.colors[d['fraction']] })
      .attr('stroke', function(d,i) { return options.colors[d['fraction']] })
      .on('mouseenter', function(d) { console.log(d); });
  }

  function createAxis(d) {
    this.append('g')
      .classed('y axis', true)
      .call(yAxis);

    this.append('g')
      .classed('x axis', true)
      .attr('transform', 'translate(0,' + height + ')')
      .call(xAxis);
  }

  ///////////////////////
  // private functions //
  ///////////////////////

  function _parseData(data, o) {
    data.forEach(function(d,i) {
      d[o.xAccessor] = parseFloat(d[o.xAccessor]);
      d[o.yAccessor] = parseFloat(d[o.yAccessor]);
      d[o.sizeAccessor] = parseFloat(d[o.sizeAccessor]);
    });

    data = data.filter(function(d,i) {
      return !isNaN(d[o.xAccessor]) && !isNaN(d[o.yAccessor]) && !isNaN(d[o.sizeAccessor]);
    });

    return data;
  }

  function _crunchData(data, options) {
      var keys = ['A', 'B', 'C', 'D'];
      var cleanData = keys.map(function(key) {
          return {
              color: options.colors[key],
              key: key,
              values: []
          }
      });

      var dataToCrunch = options.filter ? data.filter(options.filter) : data;

      dataToCrunch.forEach(function(d) {
          if (d.fraction) {
              var index = keys.indexOf(d.fraction);
              cleanData[index].values.push({
                  x: d[options.xAccessor],
                  y: d[options.yAccessor],
                  size: d[options.sizeAccessor]
              });
          }
      });

      return cleanData;
  }

  // function _parseData(data) {
  //     // cast strings to number if data is numeric
  //     for (var key in data) {
  //         var d = +data[key];
  //         if (!isNaN(d) && isFinite(d)) {
  //             data[key] = d;
  //         }
  //     }
  //     return data;
  // }

  function _merge() {
      var obj = {},
          key;

      for (var i = 0; i < arguments.length; i++) {
          for (key in arguments[i]) {
              if (arguments[i].hasOwnProperty(key)) {
                  obj[key] = arguments[i][key];
              }
          }
      }
      return obj;
  }

  return function(selector, _options) {

      if (typeof selector === 'undefined') {
          throw new Error('You need to specify a selector.');
      }

      if (typeof _options === 'undefined' || !_options.path) {
          throw new Error('You need to specify options: path');
      }

      var optionsDefault = {
          xAccessor: 'gdp_2014',
          yAccessor: 'co2_t_pc_2012',
          sizeAccessor: 'population_2014',
          xAxisLabel: 'gdp 2014',
          yAxisLabel: 'unemployment 2013',
          colors: {
            A : '#005fcc',
            B : '#5c0000',
            C : '#009300',
            D : '#ea8500'
          },
          pointRange: [10, 1000],
          xTicks: 5,
          yTicks: 5,
          height: 400,
          lang: 'de',
          interactive: true,
          showLegend: false,
          margin: {
              top: 40,
              right: 50,
              bottom: 40,
              left: 75
          },
          filter: null
      };

      _options = _merge(_options, optionsDefault);

      d3.csv(_options.path, function(err, data) {
        if(err) {
          throw new Error('Data not found.');
          return false;
        }
        data = _parseData(data, _options);
        globalData = data;
        globalOpts = _options;
        globalSelector = selector;
        renderChart(selector, _options, data);
        bindEvents();
      });

      return this;
  }

}));
