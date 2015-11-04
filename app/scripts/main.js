var BubbleChart = require('./bubblechart');

var bChart = new BubbleChart('#chart', { path : 'data/climate-data.csv', lang: 'en'});


// test user interface 
var selects = document.querySelectorAll('.chart-ui select');
var tableHeaders = ['population_2000','population_2014','population_2020','population_2030','population_2050','average_monthly_disposable_salary_2014','unemployment_2013','gdp_pc_ppp_2012','gdp_pc_ppp_2014','gdp_2012','gdp_2014','gdp_growth_2014','co2_kt_2012','co2_t_pc_2012','total_primary_energy_production_2012','total_primary_energy_production_2008','total_recoverable_coal_2011'];

tableHeaders.forEach(function(th){
  [].forEach.call(selects, function(s){
    s.appendChild(new Option(th, th));
  });
});

[].forEach.call(selects, function(s){
    s.addEventListener('change', updateChart);
});

function updateChart(evt){
  var chartOptions = {
    xAccessor: selects[0][selects[0].selectedIndex].value,
    yAccessor: selects[1][selects[1].selectedIndex].value,
    sizeAccessor:selects[2][selects[2].selectedIndex].value
  };

  bChart.update(chartOptions)
}