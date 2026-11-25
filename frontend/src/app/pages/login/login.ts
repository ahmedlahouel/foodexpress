import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Auth } from '../../core/services/auth';

@Component({
  imports: [FormsModule, RouterLink],
  selector: 'app-login',
  styleUrl: './login.css',
  templateUrl: './login.html',
})
export class Login {
  private auth = inject(Auth);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  email = signal('');
  password = signal('');
  error = signal('');
  loading = signal(false);

  submit() {
    this.error.set('');
    if (!this.email().trim() || !this.password()) {
      this.error.set('Email et mot de passe obligatoires');
      return;
    }
    this.loading.set(true);
    this.auth.login({ email: this.email().trim(), password: this.password() }).subscribe({
      next: (res) => {
        // returnUrl is only used if it is an internal path
        const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
        const target =
          returnUrl && returnUrl.startsWith('/') && !returnUrl.startsWith('//')
            ? returnUrl
            : this.auth.homeFor(res.user.role);
        this.router.navigateByUrl(target);
      },
      error: (e) => {
        this.loading.set(false);
        this.error.set(e.error?.message ?? 'Erreur de connexion');
      },
    });
  }
}
