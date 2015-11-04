require('style!css!../../node_modules/nvd3/build/nv.d3.css');
var d3 = require('d3');
window.d3 = d3;
var nvd3 = require('nvd3');

function ClimateFactions(selector, _options) {
    if (typeof selector === 'undefined') {
        throw new Error('You need to specify a selector.')
    }

    if (typeof _options === 'undefined' || !_options.path) {
        throw new Error('You need to specify options: path')
    }
    
    var optionsDefault = {
        selector: '#bubble-chart',
        xAccessor: 'gdp_2014',
        yAccessor: 'unemployment_2013',
        sizeAccessor: 'population_2014',
        colors: ['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728'],
        xTicks : 5,
        yTicks : 5,
        height: 400,
        margin: {top:40, right: 50, bottom: 25, left: 75}
    };

    this.options = _merge(optionsDefault, _options);
    this.chart = nv.models.scatterChart()
        .color(this.options.colors)
        .height(this.options.height)
        .margin(this.options.margin)
        .showDistX(false)
        .showDistY(false)
        .useVoronoi(true)
        .showLegend(true)
        .duration(300);  

    this.chartData = null;
    this.data = null;

    d3.csv(this.options.path, _parseData, function(err, data) {

        if(err){
            throw new Error('Error loading ' + this.options.path )
        }

        this.data = data;
        var cleanData = _crunchData(data, this.options);
    
        nv.addGraph(function() {

            var chartWrapper = d3.select(selector)
                .style('height', this.options.height + 'px')
                .append('svg');

            this.chart.dispatch.on('renderEnd', function() {
                console.log('chart updated');
            });

            //this.chart.xAxis.tickFormat(d3.format('.01f'));
            //this.chart.yAxis.tickFormat(d3.format('.01f'));

            this.chart.xAxis.ticks(this.options.xTicks);
            this.chart.yAxis.ticks(this.options.yTicks);
            this.chartData = d3.select(chartWrapper.node()).datum(cleanData)
            this.chartData.call(this.chart);

            nv.utils.windowResize(this.chart.update);

        }.bind(this));

    }.bind(this));

    this.update = function(_options) {

        var newOptions = _merge(this.options, _options);
        var cleanData = _crunchData(this.data, newOptions);

        this.chartData.datum(cleanData).call(this.chart);
        nv.utils.windowResize(chart.update);
    }

    ///////////////////////
    // private functions //
    ///////////////////////

    function _crunchData(data, options) {
        var keys = ['A', 'B', 'C', 'D'];
        var cleanData = keys.map(function(key) {
            return { key: key, values: [] }
        });

        data.forEach(function(d) {
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

    function _parseData(d) {
        d.gdp_2012 = +d.gdp_2012;
        d.gdp_2014 = +d.gdp_2014;
        d.gdp_growth_2014 = +d.gdp_growth_2014;
        d.gdp_pc_ppp_2012 = +d.gdp_pc_ppp_2012;
        d.gdp_pc_ppp_2014 = +d.gdp_pc_ppp_2014;

        d.population_2000 = +d.population_2000;
        d.population_2014 = +d.population_2014;
        d.population_2020 = +d.population_2020;
        d.population_2030 = +d.population_2030;
        d.population_2050 = +d.population_2050;

        d.total_primary_energy_production_2008 = +d.total_primary_energy_production_2008;
        d.total_primary_energy_production_2012 = +d.total_primary_energy_production_2012;

        d.total_recoverable_coal_2011 = +d.total_recoverable_coal_2011;
        d.average_monthly_disposable_salary_2014 = +d.average_monthly_disposable_salary_2014;
        d.co2_kt_2012 = +d.co2_kt_2012;
        d.co2_t_pc_2012 = +d.co2_t_pc_2012;

        d.unemployment_2013 = +d.unemployment_2013;

        return d;
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

    return this;
}


module.exports = ClimateFactions;