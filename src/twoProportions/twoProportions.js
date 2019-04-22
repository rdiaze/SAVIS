// TODO(matthewmerrill): don't CDN
//import Chart from "chart.js";

import {countWhere} from "../util/math.js";
import {randomInt, shuffle} from "../util/sampling.js";
import StackedDotChart from "../util/stackeddotchart.js";
import TailChart from "../util/tailchart.js";
import TwoPropChart from "./twoPropChart.js";

export class TwoProportions {

  constructor(twoPropDiv) {
    this.dom = {
      twoPropDiv,
      aSuccess: twoPropDiv.querySelector('#a-success'),
      aFailure: twoPropDiv.querySelector('#a-failure'),
      bSuccess: twoPropDiv.querySelector('#b-success'),
      bFailure: twoPropDiv.querySelector('#b-failure'),
      inputCanvas: twoPropDiv.querySelector("#input-bars"),
      lastSimCanvas: twoPropDiv.querySelector("#last-sim-bars"),
      tailChartCanvas: twoPropDiv.querySelector('#tail-chart'),
      numSimulations: twoPropDiv.querySelector('#num-simulations'),
      tailDirectionElement: twoPropDiv.querySelector('#tail-direction'),
      tailInputElement: twoPropDiv.querySelector('#tail-input'),
    };

    let summaryElements = {};
    let summaryElementList = twoPropDiv.querySelectorAll('[twopropsummary]');
    for (let summaryElement of summaryElementList) {
      let key = summaryElement.getAttribute('twopropsummary');
      if (!summaryElements[key]) {
        summaryElements[key] = [];
      }
      summaryElements[key].push(summaryElement);
    }

    this.charts = {
      inputChart: new TwoPropChart(this.dom.inputCanvas),
      lastSimChart: new TwoPropChart(this.dom.lastSimCanvas),
      tailChart: new TailChart({
        chartElement: this.dom.tailChartCanvas,
        whatAreWeRecording: 'Differences',
        summaryElements: summaryElements,
      }),
    };
    this.dom.tailDirectionElement.addEventListener('change', () => {
      this.charts.tailChart.setTailDirection(this.dom.tailDirectionElement.value);
      this.charts.tailChart.updateChart();
    });
    this.dom.tailInputElement.addEventListener('change', () => {
      this.charts.tailChart.setTailInput(this.dom.tailInputElement.value * 1);
      this.charts.tailChart.updateChart();
    });
  }

  loadData() {
    let numASuccess = this.dom.aSuccess.value * 1;
    let numAFailure = this.dom.aFailure.value * 1;
    let numBSuccess = this.dom.bSuccess.value * 1;
    let numBFailure = this.dom.bFailure.value * 1;
    this.data = { numASuccess, numAFailure, numBSuccess, numBFailure };
    this.charts.inputChart.setProportions(this.data);
    this.charts.inputChart.update();
    this.charts.lastSimChart.setProportions({
      numASuccess: 0, numAFailure: 0, numBSuccess: 0, numBFailure: 0,
    });
    this.charts.lastSimChart.update();
    this.charts.tailChart.reset();
    this.charts.tailChart.updateChart();
  }

  runSimulations() {
    let numSimulations = this.dom.numSimulations.value * 1;
    let {numASuccess, numAFailure, numBSuccess, numBFailure} = this.data;
    let totalSuccess = numASuccess + numBSuccess;
    let totalFailure = numAFailure + numBFailure;
    let totalGroupA = numASuccess + numAFailure;
    let totalGroupB = numBSuccess + numBFailure;
    for (let simIdx = 0; simIdx < numSimulations; simIdx++) {
      //TODO(matthewmerrill): this isn't right, it should be BINOM
      //let minASuccesses = Math.max(0, totalSuccess - totalGroupB);
      //let maxASuccesses = Math.min(totalGroupA, totalSuccess);
      //let sampleASuccess = randomInt(minASuccesses, maxASuccesses + 1);
      //let sampleBSuccess = totalSuccess - sampleASuccess;
      //TODO(matthewmerrill): don't shuffle
      let allItems = new Array(totalGroupA + totalGroupB);
      allItems.fill(0);
      allItems.fill(1, 0, totalSuccess);
      let shuffled = shuffle(allItems);
      let sampleA = shuffled.slice(0, totalGroupA);
      let sampleB = shuffled.slice(totalGroupA);
      let sampleASuccess = countWhere(sampleA, x => x == 1);
      let sampleBSuccess = countWhere(sampleB, x => x == 1);
      let sampleAProportion = sampleASuccess / totalGroupA;
      let sampleBProportion = sampleBSuccess / totalGroupB;
      this.addSimulationResult(sampleAProportion - sampleBProportion);
      if (simIdx + 1 === numSimulations) {
        this.charts.lastSimChart.setProportions({
          numASuccess: sampleASuccess,
          numBSuccess: sampleBSuccess,
          numAFailure: totalGroupA - sampleASuccess,
          numBFailure: totalGroupB - sampleBSuccess,
        });
      }
    }
    this.charts.lastSimChart.update();
    this.charts.tailChart.updateChart();
  }

  addSimulationResult(diffOfProps) {
    this.charts.tailChart.addResult(diffOfProps);
  }

  updateSummary() {
    let {total, chosen, unchosen} = this.charts.summary;
  }

}
