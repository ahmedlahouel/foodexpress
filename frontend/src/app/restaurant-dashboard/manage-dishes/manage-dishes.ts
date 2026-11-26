import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { DishService } from '../../core/services/dish.service';
import { RestaurantService } from '../../core/services/restaurant.service';
import { ToastService } from '../../core/services/toast.service';
import { Category, Dish, Restaurant } from '../../core/mock-data';
import { Loading } from '../../shared/loading';
import { ErrorMessage } from '../../shared/error-message';

@Component({
  imports: [FormsModule, Loading, ErrorMessage],
  selector: 'app-manage-dishes',
  styleUrl: './manage-dishes.css',
  templateUrl: './manage-dishes.html',
})
export class ManageDishes {
  private dishApi = inject(DishService);
  private restaurantApi = inject(RestaurantService);
  private toast = inject(ToastService);

  restaurants = signal<Restaurant[]>([]);
  restaurantId = signal('');
  dishes = signal<Dish[]>([]);
  categories = signal<Category[]>([]);
  loading = signal(true);
  error = signal('');

  // Form state: editingId = null means "add", otherwise "edit this dish"
  editingId = signal<string | null>(null);
  nom = signal('');
  description = signal('');
  prix = signal<number | null>(null);
  image = signal('');
  categorie = signal('');
  disponible = signal(true);
  formError = signal('');

  constructor() {
    this.restaurantApi.getMine().subscribe({
      next: (list) => {
        this.restaurants.set(list);
        if (list.length) {
          this.selectRestaurant(list[0]._id);
        } else {
          this.loading.set(false);
        }
      },
      error: (e) => {
        this.loading.set(false);
        this.error.set(e.error?.message ?? 'Erreur de chargement');
      },
    });
  }

  selectRestaurant(id: string) {
    this.restaurantId.set(id);
    this.cancel();
    this.loading.set(true);
    forkJoin({ dishes: this.dishApi.getByRestaurant(id), categories: this.dishApi.getCategories(id) }).subscribe({
      next: ({ dishes, categories }) => {
        this.dishes.set(dishes);
        this.categories.set(categories);
        this.loading.set(false);
      },
      error: (e) => {
        this.loading.set(false);
        this.error.set(e.error?.message ?? 'Erreur de chargement');
      },
    });
  }

  private reloadDishes() {
    this.dishApi.getByRestaurant(this.restaurantId()).subscribe({
      next: (dishes) => this.dishes.set(dishes),
      error: (e) => this.error.set(e.error?.message ?? 'Erreur de chargement'),
    });
  }

  categoryName(id: string | null) {
    return this.categories().find((c) => c._id === id)?.nom ?? '—';
  }

  edit(d: Dish) {
    this.editingId.set(d._id);
    this.nom.set(d.nom);
    this.description.set(d.description ?? '');
    this.prix.set(d.prix);
    this.image.set(d.image ?? '');
    this.categorie.set(d.categorie ?? '');
    this.disponible.set(d.disponible);
    this.formError.set('');
  }

  cancel() {
    this.editingId.set(null);
    this.nom.set('');
    this.description.set('');
    this.prix.set(null);
    this.image.set('');
    this.categorie.set('');
    this.disponible.set(true);
    this.formError.set('');
  }

  save() {
    this.formError.set('');
    const prix = this.prix();
    if (!this.nom().trim()) {
      this.formError.set('Le nom est obligatoire');
      return;
    }
    if (prix === null || prix < 0) {
      this.formError.set('Le prix doit être un nombre positif');
      return;
    }

    const body = {
      nom: this.nom().trim(),
      description: this.description().trim(),
      prix,
      image: this.image().trim(),
      disponible: this.disponible(),
      categorie: this.categorie() || null,
    };
    const id = this.editingId();
    const request = id
      ? this.dishApi.update(id, body)
      : this.dishApi.create({ ...body, restaurant: this.restaurantId() });

    request.subscribe({
      next: () => {
        this.toast.success(id ? 'Plat modifié' : 'Plat ajouté');
        this.cancel();
        this.reloadDishes();
      },
      error: (e) => this.formError.set(e.error?.message ?? "Erreur lors de l'enregistrement"),
    });
  }

  toggleAvailability(d: Dish) {
    this.dishApi.update(d._id, { disponible: !d.disponible }).subscribe({
      next: () => {
        this.toast.success(d.disponible ? 'Plat marqué indisponible' : 'Plat marqué disponible');
        this.reloadDishes();
      },
      error: (e) => this.toast.error(e.error?.message ?? 'Erreur'),
    });
  }

  remove(d: Dish) {
    if (!confirm(`Supprimer le plat « ${d.nom} » ?`)) return;
    this.dishApi.remove(d._id).subscribe({
      next: () => {
        this.toast.success('Plat supprimé');
        this.reloadDishes();
      },
      error: (e) => this.toast.error(e.error?.message ?? 'Erreur lors de la suppression'),
    });
  }
}
