import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CategoryItem, CategoryService } from '../../core/services/category.service';
import { ToastService } from '../../core/services/toast.service';
import { Loading } from '../../shared/loading';
import { ErrorMessage } from '../../shared/error-message';

@Component({
  imports: [FormsModule, Loading, ErrorMessage],
  selector: 'app-admin-categories',
  styleUrl: './admin-categories.css',
  templateUrl: './admin-categories.html',
})
export class AdminCategories {
  private api = inject(CategoryService);
  private toast = inject(ToastService);

  categories = signal<CategoryItem[]>([]);
  loading = signal(true);
  error = signal('');

  // Form state: editingId = null means "add", otherwise "edit this category"
  editingId = signal<string | null>(null);
  nom = signal('');
  description = signal('');
  formError = signal('');

  constructor() {
    this.load();
  }

  load() {
    this.api.getAll().subscribe({
      next: (list) => {
        this.categories.set(list);
        this.loading.set(false);
      },
      error: (e) => {
        this.loading.set(false);
        this.error.set(e.error?.message ?? 'Erreur de chargement');
      },
    });
  }

  edit(c: CategoryItem) {
    this.editingId.set(c._id);
    this.nom.set(c.nom);
    this.description.set(c.description ?? '');
    this.formError.set('');
  }

  cancel() {
    this.editingId.set(null);
    this.nom.set('');
    this.description.set('');
    this.formError.set('');
  }

  save() {
    this.formError.set('');
    if (!this.nom().trim()) {
      this.formError.set('Le nom est obligatoire');
      return;
    }
    const body = { nom: this.nom().trim(), description: this.description().trim() };
    const id = this.editingId();
    const request = id ? this.api.update(id, body) : this.api.create(body);

    request.subscribe({
      next: () => {
        this.toast.success(id ? 'Catégorie modifiée' : 'Catégorie ajoutée');
        this.cancel();
        this.load();
      },
      error: (e) => this.formError.set(e.error?.message ?? "Erreur lors de l'enregistrement"),
    });
  }

  remove(c: CategoryItem) {
    if (!confirm(`Supprimer la catégorie « ${c.nom} » ?`)) return;
    this.api.remove(c._id).subscribe({
      next: () => {
        this.toast.success('Catégorie supprimée');
        this.load();
      },
      error: (e) => this.toast.error(e.error?.message ?? 'Erreur lors de la suppression'),
    });
  }
}
