import { Component } from '@angular/core';

@Component({
  selector: 'app-footer',
  template: `
    <footer class="bg-charcoal text-light py-4 mt-5">
      <div class="container text-center">
        <strong class="text-orange">FoodExpress</strong>
        <p class="mb-0 small">Vos plats préférés, livrés chez vous.</p>
        <p class="mb-0 small text-secondary">© 2026 FoodExpress</p>
      </div>
    </footer>
  `,
})
export class Footer {}
