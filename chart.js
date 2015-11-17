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

  /////////////////////
  // tooltip factory //
  /////////////////////

  var Tooltip = function() {

    var tooltip, top, left, ttHead, ttBody, chartWidth;

    function create(parent, cw) {
      chartWidth = cw;
      tooltip = parent.append('div').classed('tooltip', true);
      ttHead = tooltip.append('div').classed('tool-head', true);
      ttBody = tooltip.append('div').classed('tool-body', true);
      return this;
    }

    function update(data) {
      ttHead.text(data.countryname_en);
      ttBody.text(data.co2_t_pc_2012);
    }

    function updatePosition(coords) {
      top = coords[1] - 50;
      left = coords[0] > (chartWidth / 2) ? coords[0] - 190 : coords[0] + 10;

      tooltip.style({
        top : top + 'px',
        left : left + 'px'
      });
    }

    function hide() {
      tooltip.style('display', 'none');
    }

    function show() {
      tooltip.style('display', 'block');
    }

    return {
      create : create,
      update : update,
      updatePosition : updatePosition,
      show : show,
      hide : hide
    }


  }

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
          top: 50,
          right: 50,
          bottom: 50,
          left: 50
        },
        filter: null,
        minRadius: 4,
        maxRadius: 15,
        maxWidth: 960,
        aspectRatio: .7,
        transitionDuration: 500
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
        bubbles,
        transitionDuration,
        margin,
        width,
        height,
        maxWidth,
        aspectRatio,
        tooltip = new Tooltip();

    function bindEvents() {
      window.addEventListener('resize', function() {
        renderChart(_selector, options, data);
      });
    }

    function updateDimensions(winWidth) {
      width = winWidth < options.maxWidth ? winWidth : options.maxWidth;
      width = width - margin.right - margin.left;
      height = width * options.aspectRatio;
    }

    function renderChart() {
      margin = options.margin;
            
      updateDimensions(window.innerWidth);
      parent = d3.select(selector);
      parent.node().innerHTML = '';

      parent = parent
        .append('div')
        .classed('climate-chart-wrapper', true);

      tooltip.create(parent, width);
      
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
      svg.call(createVoronoi);

      parent.call(createLabels);
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

      y = d3.scale.linear().domain([-.5, yExtent[1]]).range([height, 0]);
      r = d3.scale.sqrt().domain(rExtent).range([options.minRadius,options.maxRadius]);
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

      this.selectAll('div.label')
        .data(data.filter(function(d) {
          return d.labeled != '';
        }))
        .enter()
        .append('div')
        .classed('label', true)
        .classed('left', function(d,i) { return x(d[options.xAccessor]) > (options.maxWidth / 2) })
        .style('left', labelPositionLeft)
        .style('top', labelPositionTop)
        .style('display', 'block')
        .text(function(d) { return d.countryname_en; });
    }
    
    function labelPositionLeft(d,i) {
      var pos_x = x(d[options.xAccessor]);
      var factor = pos_x > options.maxWidth / 2 ? -1 : 1;
      pos_x += (r(d[options.sizeAccessor])+5) * factor;
      pos_x += margin.left;
      pos_x += 'px';
      return pos_x;
    }

    function labelPositionTop(d,i) {
      return (y(d[options.yAccessor]) - 6 + margin.top) + 'px';
    }

    function createVoronoi() {
      var voro = d3.geom.voronoi()
        .clipExtent([[0,0], [width, height]])
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
        })
        .on('mousemove', onMouseMove);

    }


    function createAxis(d) {

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

    function updateChart(isGroupFocus) {
      if(!isGroupFocus) {
        initScales();
      }

      svg.selectAll('circle.bubble')
        .transition()
        .duration(options.transitionDuration)
        .attr('cx', function(d,i) { return x(d[options.xAccessor]) })
        .attr('cy', function(d,i) { return y(d[options.yAccessor]) })
        .attr('r', function(d,i) { return r(d[options.sizeAccessor]) })

      svg.selectAll('text.label')
        .transition()
        .duration(options.transitionDuration)
        .attr('x', function(d,i) { return x(d[options.xAccessor]) - r(d[options.sizeAccessor]) - 2 })
        .attr('y', function(d,i) { return y(d[options.yAccessor]) })

      svg.call(createVoronoi);
    }

    function onMouseEnter(d,i) {
      if(d.node.datum().disabled) { return false };
      tooltip.update(d.node.datum());
      tooltip.show();
      d.node.classed('active', true);
    }

    function onMouseMove(d,i) {
      tooltip.updatePosition(d3.mouse(parent.node()));
    }

    function onMouseLeave(d,i) {
      d.node.classed('active', false);
      tooltip.hide();
    }

    function focusGroup(groupId) {
      //filter data
      var filteredData = data.filter(function(d,i) {
        return d.fraction == groupId;
      });

      // calculate new x-extent
      var nExtent = d3.extent(filteredData, function(d,i) {
        return d[options.xAccessor];
      });

      //set new domain for x-axis
      x.domain(nExtent);
      
      //animate x-axis to new extent
      svg.selectAll('.x.axis')
        .transition()
        .duration(options.transitionDuration)
        .call(xAxis);

      //highlight all circles in group
      svg.selectAll('circle.bubble')
        .style('opacity', .2)
        .each(function(d,i) { d.disabled = true })
        .filter(function(d,i) { return d.fraction == groupId })
        .style('opacity', 1)
        .each(function(d,i) { d.disabled = false });

      parent.selectAll('div.label')
        .style('display', 'none')
        .filter(function(d) { return d.fraction == groupId })
        .transition()
        .duration(options.transitionDuration)
        .style('left', labelPositionLeft)
        .style('display', 'block');

      updateChart(true);
      svg.call(createVoronoi);
    }

    function reset() {
      updateChart();
      xAxis.scale(x);
      
      svg.call(createAxis);
      svg.call(createVoronoi);

      parent.selectAll('div.label')
        .style('display', 'block')
        .transition()
        .duration(options.transitionDuration)
        .style('left', labelPositionLeft)


      svg.selectAll('circle.bubble')
        .style('opacity', 1)
        .each(function(d,i) { d.disabled = false });
    }

    function update(newOpts) {
      options = _merge(options,newOpts);
      updateChart();
    }


    /////////////
    // exports //
    /////////////

    return {
      update : update,
      focusGroup : focusGroup,
      reset : reset
    }
  }

}));
