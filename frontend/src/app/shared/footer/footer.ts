import { Component } from '@angular/core';

@Component({
  selector: 'app-footer',
  template: `
    <footer class="bg-charcoal text-light pt-5 pb-3 mt-5 fe-footer">
      <div class="container">
        <div class="row g-4">
          <div class="col-md-5">
            <h5 class="text-orange fw-bold">🍴 FoodExpress</h5>
            <p class="small text-secondary mb-0">Vos plats préférés, livrés chez vous. Pizza, sushi, grillades, burgers et bien plus encore.</p>
          </div>
          <div class="col-6 col-md-3">
            <h6>Découvrir</h6>
            <ul class="list-unstyled small mb-0">
              <li><a class="fe-footer-link" href="/restaurants">Restaurants</a></li>
              <li><a class="fe-footer-link" href="/cart">Mon panier</a></li>
              <li><a class="fe-footer-link" href="/my-orders">Mes commandes</a></li>
            </ul>
          </div>
          <div class="col-6 col-md-4">
            <h6>Contact</h6>
            <ul class="list-unstyled small text-secondary mb-0">
              <li>📍 Bizerte, Tunisie</li>
              <li>✉️ contact&#64;foodexpress.tn</li>
              <li>🕒 Tous les jours, 10h – 00h</li>
            </ul>
          </div>
        </div>
        <hr class="border-secondary mt-4" />
        <p class="mb-0 small text-center text-secondary">© 2026 FoodExpress · Fait avec 🧡 par l'équipe</p>
      </div>
    </footer>
  `,
})
export class Footer {}
