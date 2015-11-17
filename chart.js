(function(root, factory) {
  if (typeof module !== 'undefined' && module.exports) {
      var d3 = require('d3');
      window.d3 = d3;
      module.exports = factory(d3);
  } else {
      root.ClimateChart = factory(root.d3);
  }
}(this, function(d3) {

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

  return function(_selector, _options) {

    var svg,
        x,
        y,
        r,
        xAxis,
        yAxis,
        xExtent,
        yExtent,
        parent,
        data,
        options,
        selector,
        bubbles;

    var width = 960,
        height = 500,
        maxWidth = 960;

    var margin = {
      top: 50,
      right: 50,
      bottom: 50,
      left: 50
    };

    function bindEvents() {
      window.addEventListener('resize', function() {
        renderChart(_selector, options, data);
      });
    }

    function updateDimensions(winWidth) {
      width = winWidth < maxWidth ? winWidth : maxWidth;
      width = width - margin.right - margin.left;
    }

    function renderChart() {
      updateDimensions(window.innerWidth);
      parent = d3.select(selector);
      parent.node().innerHTML = '';

      svg = parent
        .append('svg')
        .classed('climate-chart', true)
        .attr('width', width + margin.right + margin.left)
        .attr('height', height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

      initScales();
      initAxis();

      svg.call(createAxis);
      svg.call(createBubbles);
      svg.call(createLabels);
      svg.call(createVoronoi);
    }

    function initScales() {
      xExtent = d3.extent(data, function(d,i) { return d[options.xAccessor] });
      yExtent = d3.extent(data, function(d,i) { return d[options.yAccessor] });
      rExtent = d3.extent(data, function(d,i) { return d[options.sizeAccessor] });

      if(options.isLogScale) {
        x = d3.scale.log().domain(xExtent).range([0, width]);
      }
      else {
        x = d3.scale.linear().domain(xExtent).range([0, width]);
      }

      y = d3.scale.linear().domain(yExtent).range([height, 0]);
      r = d3.scale.sqrt().domain(rExtent).range([3,25]);
      color = d3.scale.ordinal().range(options.colors);
    }

    function initAxis() {
      xAxis = d3.svg.axis()
        .orient('bottom')
        .scale(x)
        .ticks(2, d3.format(",d"));

      yAxis = d3.svg.axis().orient('left').scale(y);
    }

    function createBubbles() {
      bubbles = svg.selectAll('circle.bubble')
        .data(data)
        .enter()
        .append('circle')
        .classed('bubble', true)
        .attr('cx', function(d,i) { return x(d[options.xAccessor]) })
        .attr('cy', function(d,i) { return y(d[options.yAccessor]) })
        .attr('r', function(d,i) { return r(d[options.sizeAccessor]) })
        .attr('fill', function(d,i) { return options.colors[d['fraction']] })
        .attr('stroke', function(d,i) { return options.colors[d['fraction']] })
    }

    function createLabels() {
      svg.selectAll('text.label')
        .data(data.filter(function(d) {
          return d.labeled != '';
        }))
        .enter()
        .append('text')
        .classed('label', true)
        .attr('x', function(d,i) { return x(d[options.xAccessor]) - r(d[options.sizeAccessor]) })
        .attr('y', function(d,i) { return y(d[options.yAccessor]) })
        .attr('text-anchor','end')
        .text(function(d) { return d.countryname_en; });
    }

    function createVoronoi() {
      var voro = d3.geom.voronoi()
        .x(function(d,i) { return x(d[options.xAccessor]) })
        .y(function(d,i) { return y(d[options.yAccessor]) })

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
            .node = bubbles.filter(function(b,i) {
              return b.countryname_en == d.point.countryname_en;
            });
        });

    }

    function updateChart() {
      initScales();

      svg.selectAll('circle.bubble')
        .transition()
        .duration(500)
        .attr('cx', function(d,i) { return x(d[options.xAccessor]) })
        .attr('cy', function(d,i) { return y(d[options.yAccessor]) })
        .attr('r', function(d,i) { return r(d[options.sizeAccessor]) })

      svg.selectAll('text.label')
        .transition()
        .duration(500)
        .attr('x', function(d,i) { return x(d[options.xAccessor]) - r(d[options.sizeAccessor]) - 2 })
        .attr('y', function(d,i) { return y(d[options.yAccessor]) })

      svg.call(createVoronoi);
    }


    function createAxis(d) {

      svg.selectAll('.climate-chart .y.axis, .climate-chart .x.axis').remove();

      this.append('g')
        .classed('y axis', true)
        .call(yAxis);

      this.append('g')
        .classed('x axis', true)
        .attr('transform', 'translate(0,' + height + ')')
        .call(xAxis);
    }

    function onMouseEnter(d,i) {
      d.node.classed('active', true);
    }

    function onMouseLeave(d,i) {
      d.node.classed('active', false);
    }

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
          xAxisLabel: 'gdp 2014',
          yAxisLabel: 'unemployment 2013',
          colors: {
            A : '#005fcc',
            B : '#5c0000',
            C : '#009300',
            D : '#ea8500'
          },
          isLogScale : true,
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

      d3.csv(_options.path, function(err, csvData) {
        if(err) {
          throw new Error('Data not found.');
          return false;
        }
        data = _parseData(csvData, _options);
        options = _options;
        selector = _selector;
        renderChart();
        bindEvents();
      });

      function update(newOpts) {
        options = _merge(options,newOpts);
        console.log(options);
        updateChart();
      }

      return {
        update : update
      }
  }

}));
