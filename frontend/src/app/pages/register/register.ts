import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Auth } from '../../core/services/auth';

// Same rule as the backend: at least 8 characters, one letter and one digit
const PASSWORD_RULE = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;

@Component({
  imports: [FormsModule, RouterLink],
  selector: 'app-register',
  styleUrl: './register.css',
  templateUrl: './register.html',
})
export class Register {
  private auth = inject(Auth);
  private router = inject(Router);

  nom = signal('');
  prenom = signal('');
  email = signal('');
  telephone = signal('');
  password = signal('');
  confirmation = signal('');
  error = signal('');
  loading = signal(false);

  submit() {
    this.error.set('');
    if (!this.nom().trim() || !this.prenom().trim() || !this.email().trim()
        || !this.telephone().trim() || !this.password() || !this.confirmation()) {
      this.error.set('Tous les champs sont obligatoires');
      return;
    }
    if (this.password() !== this.confirmation()) {
      this.error.set('La confirmation ne correspond pas au mot de passe');
      return;
    }
    if (!PASSWORD_RULE.test(this.password())) {
      this.error.set('Le mot de passe doit contenir au moins 8 caractères, une lettre et un chiffre');
      return;
    }

    this.loading.set(true);
    this.auth
      .register({
        nom: this.nom().trim(),
        prenom: this.prenom().trim(),
        email: this.email().trim(),
        telephone: this.telephone().trim(),
        password: this.password(),
        confirmation: this.confirmation(),
      })
      .subscribe({
        next: () => this.router.navigateByUrl('/'),
        error: (e) => {
          this.loading.set(false);
          this.error.set(e.error?.message ?? "Erreur lors de l'inscription");
        },
      });
  }
}
