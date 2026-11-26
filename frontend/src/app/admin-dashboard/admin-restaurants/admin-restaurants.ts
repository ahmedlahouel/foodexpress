import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AdminService, AdminUser } from '../../core/services/admin.service';
import { AdminRestaurant, RestaurantService, Validation } from '../../core/services/restaurant.service';
import { ToastService } from '../../core/services/toast.service';
import { Loading } from '../../shared/loading';
import { ErrorMessage } from '../../shared/error-message';

const LABELS: Record<Validation, string> = {
  en_attente: 'En attente',
  valide: 'Validé',
  suspendu: 'Suspendu',
};

const BADGES: Record<Validation, string> = {
  en_attente: 'bg-warning text-dark',
  valide: 'bg-success',
  suspendu: 'bg-danger',
};

@Component({
  imports: [FormsModule, Loading, ErrorMessage],
  selector: 'app-admin-restaurants',
  styleUrl: './admin-restaurants.css',
  templateUrl: './admin-restaurants.html',
})
export class AdminRestaurants {
  private api = inject(RestaurantService);
  private adminApi = inject(AdminService);
  private toast = inject(ToastService);

  readonly statuts = Object.keys(LABELS) as Validation[];

  restaurants = signal<AdminRestaurant[]>([]);
  owners = signal<AdminUser[]>([]);
  statutFilter = signal<Validation | ''>('');
  loading = signal(true);
  error = signal('');

  // Form state: editingId = null means "add", otherwise "edit this restaurant"
  editingId = signal<string | null>(null);
  editingOwner = signal('');
  nom = signal('');
  adresse = signal('');
  typeCuisine = signal('');
  fraisLivraison = signal<number | null>(null);
  horaires = signal('');
  description = signal('');
  image = signal('');
  isOpen = signal(true);
  owner = signal('');
  formError = signal('');

  constructor() {
    this.adminApi.users({ role: 'restaurateur', limit: 50 }).subscribe({
      next: (res) => this.owners.set(res.users),
      error: (e) => this.error.set(e.error?.message ?? 'Erreur de chargement'),
    });
    this.load();
  }

  load() {
    this.api.getAllAdmin(this.statutFilter()).subscribe({
      next: (list) => {
        this.restaurants.set(list);
        this.loading.set(false);
      },
      error: (e) => {
        this.loading.set(false);
        this.error.set(e.error?.message ?? 'Erreur de chargement');
      },
    });
  }

  label(s: Validation) {
    return LABELS[s];
  }

  badge(s: Validation) {
    return 'badge ' + BADGES[s];
  }

  edit(r: AdminRestaurant) {
    this.editingId.set(r._id);
    this.editingOwner.set(r.owner ? `${r.owner.prenom} ${r.owner.nom}` : '—');
    this.nom.set(r.nom);
    this.adresse.set(r.adresse);
    this.typeCuisine.set(r.typeCuisine);
    this.fraisLivraison.set(r.fraisLivraison);
    this.horaires.set(r.horaires ?? '');
    this.description.set(r.description ?? '');
    this.image.set(r.image ?? '');
    this.isOpen.set(r.isOpen);
    this.formError.set('');
  }

  cancel() {
    this.editingId.set(null);
    this.editingOwner.set('');
    this.nom.set('');
    this.adresse.set('');
    this.typeCuisine.set('');
    this.fraisLivraison.set(null);
    this.horaires.set('');
    this.description.set('');
    this.image.set('');
    this.isOpen.set(true);
    this.owner.set('');
    this.formError.set('');
  }

  save() {
    this.formError.set('');
    const frais = this.fraisLivraison();
    const id = this.editingId();

    if (!this.nom().trim() || !this.adresse().trim() || !this.typeCuisine().trim()) {
      this.formError.set('Nom, adresse et type de cuisine sont obligatoires');
      return;
    }
    if (frais === null || frais < 0) {
      this.formError.set('Les frais de livraison doivent être un nombre positif');
      return;
    }
    if (!id && !this.owner()) {
      this.formError.set('Choisissez un propriétaire (restaurateur)');
      return;
    }

    const body = {
      nom: this.nom().trim(),
      adresse: this.adresse().trim(),
      typeCuisine: this.typeCuisine().trim(),
      fraisLivraison: frais,
      horaires: this.horaires().trim(),
      description: this.description().trim(),
      image: this.image().trim(),
      isOpen: this.isOpen(),
    };
    const request = id ? this.api.update(id, body) : this.api.create({ ...body, owner: this.owner() });

    request.subscribe({
      next: () => {
        this.toast.success(id ? 'Restaurant modifié' : 'Restaurant ajouté (en attente de validation)');
        this.cancel();
        this.load();
      },
      error: (e) => this.formError.set(e.error?.message ?? "Erreur lors de l'enregistrement"),
    });
  }

  setValidation(r: AdminRestaurant, statut: Validation) {
    this.api.setValidation(r._id, statut).subscribe({
      next: () => {
        this.toast.success(statut === 'valide' ? 'Restaurant validé' : 'Restaurant suspendu');
        this.load();
      },
      error: (e) => this.toast.error(e.error?.message ?? 'Erreur'),
    });
  }

  remove(r: AdminRestaurant) {
    if (!confirm(`Supprimer « ${r.nom} » et tous ses plats ?`)) return;
    this.api.remove(r._id).subscribe({
      next: () => {
        this.toast.success('Restaurant supprimé');
        this.load();
      },
      error: (e) => this.toast.error(e.error?.message ?? 'Erreur lors de la suppression'),
    });
  }
}
