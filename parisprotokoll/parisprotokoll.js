/* global ClimateChart */

var ParisprotokollChart = function(el, options) {
  'use strict';

  var chart = new ClimateChart(el, options);
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
};
