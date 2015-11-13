(function(root, factory) {
  if (typeof module !== 'undefined' && module.exports) {
      var d3 = require('d3');
      window.d3 = d3;
      module.exports = factory(d3);
  } else {
      root.ClimateChart = factory(root.d3);
  }
}(this, function(d3) {

  function Chart(selector, _options) {

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
          colors: ['#005fcc', '#5c0000', '#009300', '#ea8500'],
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
        renderChart(selector, _options, data);
      });

      return this;
  }

  var svg, x, y, r, color, xAxis, yAxis, xExtent, yExtent, bubbleGroup;

  var width = 960,
      height = 500;

  var margin = {
    top: 50,
    right : 50,
    bottom : 50,
    left : 50
  }

  function renderChart(selector, options, data) {

    svg = d3.select(selector)
      .append('svg')
      .attr('width', width + margin.right + margin.left)
      .attr('height', height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    xExtent = d3.extent(data, function(d,i) { return d[options.xAccessor] });
    yExtent = d3.extent(data, function(d,i) { return d[options.yAccessor] });
    rExtent = d3.extent(data, function(d,i) { return d[options.sizeAccessor] });

    xAxis = d3.svg.axis().orient('bottom').scale(x);
    yAxis = d3.svg.axis().orient('left').scale(y);

    x = d3.scale.linear().domain(xExtent).range([margin.left, width - margin.right]);
    y = d3.scale.linear().domain(yExtent).range([height - margin.bottom, margin.top]);
    r = d3.scale.sqrt().domain(rExtent).range([3,10]);
    color = d3.scale.ordinal().range(options.colors);

    // bubbleGroup = svg.append('g')
    //   .classed('bubble-group', true)
    //   .attr('width', width + margin.right + margin.left)
    //   .attr('height', height + margin.top + margin.bottom);

    svg.selectAll('circle.bubble')
      .data(data)
      .enter()
      .append('circle')
      .classed('bubble', true)
      .attr('cx', function(d,i) { return x(d[options.xAccessor]) })
      .attr('cy', function(d,i) { return y(d[options.yAccessor]) })
      .attr('r', function(d,i) { return r(d[options.sizeAccessor]) })
      .attr('fill', function(d,i) { return color(d['fraction'] )});

    svg.call(createAxis);
  }

  function createAxis(d) {
    console.log(this);
    this.append('g')
      .classed('y axis', true)
      .call(yAxis);
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

  return Chart;

}));
