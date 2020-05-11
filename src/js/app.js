/* global $*/

/**
 * Document ready function
 * @author Eren Cakmak eren.cakmak@uni-konstanz.de
 */

import 'bootstrap/dist/css/bootstrap.min.css';
import '../css/style.css';
import 'bootstrap';
import 'bootstrap-select/js/bootstrap-select';
import 'bootstrap-select/dist/css/bootstrap-select.css';
import '@mdi/font/scss/materialdesignicons.scss';

import { loadData } from './data.js';

import { removeTank } from './controller.js';

$(document).ready(function () {
  // load the data
  $('#dataset-select').on('change', function (e) {
    if (this.value) {
      $('#loading').show();
      $('#play-icon').hide();
      removeTank();
      const path = 'data/' + this.value;
      loadData(path);
    }
  });
  // per defeault load the fish 5 dataset
  loadData('data/fish-5.csv');
});
