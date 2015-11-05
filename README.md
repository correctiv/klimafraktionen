# Klimafraktionen

NVD3 Bubblechart-Wrapper.

## How it works

Check example/index.html.

```
var bChart = new BubbleChart('#chart', { 
  path : 'data/climate-data.csv', 
  xAccessor: 'gdp_2014',
  yAccessor: 'unemployment_2013',
  sizeAccessor: 'population_2014',
  xAxisLabel: 'x-axis label', // null if you dont want to show a label
  yAxisLabel: 'y-axis label',
  colors: {A : '#1f77b4', B: '#ff7f0e', C: '#2ca02c', D: '#d62728'},
  pointRange: [10, 1000], // measured in pxArea
  interactive : true,
  showLegend: true,
  height: 350,
  lang: 'en',
  filter : function(d, i){ // null = no filter
    return d.gdp_2014 < 5000000000000;
  }
});
```

Update an existing bubblechart:

```
var chartOptions = {
  xAccessor: 'co2_kt_2012',
  yAccessor: 'unemployment_2013',
  sizeAccessor: 'population_2014',
  filter: null
};

bChart.update(chartOptions);
```

## Usage 

You can use the bubblechart-wrapper with commonjs or browser globals.
For both variants you have to **add the styles of nvd3** to your project.

#### CommonJS

```
var BubbleChart = require('./bubble-chart');

```

#### Browser globals

```
<script src="bubble-chart/index.js"></script>
```