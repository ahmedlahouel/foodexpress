import { Component, computed, input, output, signal } from '@angular/core';

// Étoiles réutilisables.
//  - lecture seule  : <app-stars [value]="4.3" />       (étoiles partielles : 4.3 → 4 pleines + 30 %)
//  - interactif     : <app-stars [value]="note()" [interactive]="true" (rate)="note.set($event)" />
@Component({
  selector: 'app-stars',
  styles: [`
    .star {
      font-size: var(--size, 1.1rem); line-height: 1; display: inline-block;
      background: linear-gradient(90deg, #ffb400 calc(var(--fill) * 100%), #d9d9d9 calc(var(--fill) * 100%));
      -webkit-background-clip: text; background-clip: text; color: transparent;
      transition: transform .12s;
    }
    .interactive .star { cursor: pointer; }
    .interactive .star:hover { transform: scale(1.2); }
  `],
  template: `
    <span class="d-inline-flex gap-1" [class.interactive]="interactive()" [style.--size]="size()"
          (mouseleave)="hover.set(0)" role="img" [attr.aria-label]="shown() + ' sur 5'">
      @for (i of stars; track i) {
        <span class="star" [style.--fill]="fill(i)"
              (mouseenter)="interactive() && hover.set(i)"
              (click)="interactive() && rate.emit(i)">★</span>
      }
    </span>
  `,
})
export class Stars {
  value = input(0);
  interactive = input(false);
  size = input('1.1rem');
  rate = output<number>();

  stars = [1, 2, 3, 4, 5];
  hover = signal(0);
  shown = computed(() => (this.interactive() && this.hover()) || this.value());

  // part (0 à 1) de l'étoile n°i qui est remplie
  fill = (i: number) => Math.min(1, Math.max(0, this.shown() - (i - 1)));
}
