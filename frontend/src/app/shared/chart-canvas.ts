import { Component, DestroyRef, ElementRef, effect, inject, input, viewChild } from '@angular/core';
import { Chart, ChartConfiguration } from 'chart.js/auto';

// Petit composant réutilisable : on lui donne une config Chart.js, il dessine le graphique.
@Component({
  selector: 'app-chart-canvas',
  template: `<div style="position:relative;height:260px"><canvas #canvas></canvas></div>`,
})
export class ChartCanvas {
  config = input.required<ChartConfiguration>();

  private canvas = viewChild.required<ElementRef<HTMLCanvasElement>>('canvas');
  private chart?: Chart;

  constructor() {
    // se relance à chaque fois que la config change (ex. données chargées)
    effect(() => {
      const cfg = this.config();
      this.chart?.destroy();
      this.chart = new Chart(this.canvas().nativeElement, cfg);
    });
    inject(DestroyRef).onDestroy(() => this.chart?.destroy());
  }
}
