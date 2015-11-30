/* global ClimateChart */

(function(ClimateChart) {
  'use strict';

  var chart = new ClimateChart('#chart', {
    height: window.innerHeight - 200,
    minWidth: window.innerWidth,
    margin: {
      top: 110,
      right: 25,
      bottom: 25,
      left: 40
    },
    path: '../data/climate-data.csv',
    locale: 'de',
    xAxisDivisor: 1000000000,
    xAxisDescription: 'Bruttoinlandsprodukt (in Mrd. US-Dollar)',
    yAxisDescription: 'jährlicher CO2-Ausstoß (Tonnen pro Kopf)',
    legendMaxDescription: '1 Mrd. Menschen',
    legendMinDescription: '100 Mio.',
    threshold: 2.48,
    thresholdDescription: 'Ziel: 2,48 t/Kopf',
    labelField: 'countryname_de',
    tooltipData: {
      'co2_t_pc_2012': {
        title: 'CO2-Ausstoß (t/Kopf)',
        divisor: 1
      },
      'gdp_2014': {
        title: 'BIP 2014 (in Mrd. US-Dollar)',
        divisor: 1000000000
      },
      'population_2014': {
        title: 'Bevölkerung 2014',
        divisor: 1
      },
      'population_2050': {
        title: 'Bevölkerung 2050 (Schätzung)',
        divisor: 1
      },
      'important_industry_de': {
        title: 'Wichtigster Wirtschaftszweig'
      },
      'climate_change_performance_index': {
        title: 'Platz im Klimaschutz-Index'
      }
    }
  });

  var focusButtons = document.querySelectorAll('[data-action-focus]');
  var linearScaleButton = document.querySelector('[data-action-linear-scale]');
  var logScaleButton = document.querySelector('[data-action-log-scale]');

  function reset() {
    chart.reset();
    Array.prototype.forEach.call(focusButtons, function(button){
      if (button.classList) {
        button.classList.remove('climate-factions__button--inactive');
        button.classList.remove('climate-factions__button--active');
      }
    });
  }

  function activateButton(selectedButton) {
    if (selectedButton.classList) {
      Array.prototype.forEach.call(focusButtons, function(button){
        button.classList.add('climate-factions__button--inactive');
        button.classList.remove('climate-factions__button--active');
      });
      selectedButton.classList.remove('climate-factions__button--inactive');
      selectedButton.classList.add('climate-factions__button--active');
    }
  }

  logScaleButton.addEventListener('click', function() {
    reset();
    linearScaleButton.style.display = 'inline';
    logScaleButton.style.display = 'none';
    chart.update({isLogScale: true});
  });

  linearScaleButton.addEventListener('click', function() {
    reset();
    linearScaleButton.style.display = 'none';
    logScaleButton.style.display = 'inline';
    chart.update({isLogScale: false});
  });

  Array.prototype.forEach.call(focusButtons, function(button){
    button.addEventListener('click', function() {
      var focusTarget = button.getAttribute('data-action-focus');
      chart.focusGroup(focusTarget);
      if (button.classList) {
        if (button.classList.contains('climate-factions__button--active')) {
          reset();
        }
        else {
          activateButton(button);
        }
      }
    });
  });
})(ClimateChart);
