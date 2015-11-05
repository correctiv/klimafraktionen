(function(root, factory) {
    if (typeof module !== 'undefined' && module.exports) {
        // we need this little hack, because nvd3 doesn't support commonjs in the right way
        var d3 = require('d3');
        window.d3 = d3;
        module.exports = factory(d3, require('nvd3'));
    } else {
        root.ClimateFactions = factory(root.d3, root.nv);
    }
}(this, function(d3, nv) {

    function ClimateFactions(selector, _options) {
        if (typeof selector === 'undefined') {
            throw new Error('You need to specify a selector.');
        }

        if (typeof _options === 'undefined' || !_options.path) {
            throw new Error('You need to specify options: path');
        }
        
        var optionsDefault = {
            xAccessor: 'gdp_2014',
            yAccessor: 'unemployment_2013',
            sizeAccessor: 'population_2014',
            xAxisLabel: 'gdp 2014',
            yAxisLabel: 'unemployment 2013',
            colors: {A: '#1f77b4', B: '#ff7f0e', C: '#2ca02c', D: '#d62728'},
            pointRange: [10, 1000],
            xTicks: 5,
            yTicks: 5,
            height: 400,
            lang: 'de',
            interactive: true,
            showLegend: false,
            margin: {top:40, right: 50, bottom: 40, left: 75},
            filter: null
        };

        this.options = _merge(optionsDefault, _options);
        this.chart = nv.models.scatterChart()
            .height(this.options.height)
            .margin(this.options.margin)
            .pointRange(this.options.pointRange)
            .interactive(this.options.interactive)
            .showLegend(this.options.showLegend)
            .showDistX(false)
            .showDistY(false)
            .useVoronoi(true)    
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

                this.chart.yAxis.axisLabel(this.options.xAxisLabel)
                this.chart.xAxis.axisLabel(this.options.yAxisLabel)

                //this.chart.xAxis.tickFormat(d3.format('.01f'));
                //this.chart.yAxis.tickFormat(d3.format('.01f'));

                this.chart.xAxis.ticks(this.options.xTicks);
                this.chart.yAxis.ticks(this.options.yTicks);
                this.chartData = d3.select(chartWrapper.node()).datum(cleanData)
                this.chartData.call(this.chart);

                nv.utils.windowResize(this.chart.update);

            }.bind(this));

        }.bind(this));

        return this;
    }

    ClimateFactions.prototype.update = function(_options){
        var newOptions = _merge(this.options, _options);
        var cleanData = _crunchData(this.data, newOptions);

        this.chartData.datum(cleanData).call(this.chart);
        nv.utils.windowResize(chart.update);

        return this;
    }

    ///////////////////////
    // private functions //
    ///////////////////////

    function _crunchData(data, options) {
        var keys = ['A', 'B', 'C', 'D'];
        var cleanData = keys.map(function(key) {
            return { color: options.colors[key], key: key, values: [] }
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

    function _parseData(data) {
        // cast strings to number if data is numeric
        for(var key in data){
            var d = +data[key];
            if(!isNaN(d) && isFinite(d)){
                data[key] = d;
            }
        }
        return data;
    }

    function _merge() {
        var obj = {}, key;

        for (var i = 0; i < arguments.length; i++) {
            for (key in arguments[i]) {
                if (arguments[i].hasOwnProperty(key)) {
                    obj[key] = arguments[i][key];
                }
            }
        }
        return obj;
    }

    return ClimateFactions;

}));