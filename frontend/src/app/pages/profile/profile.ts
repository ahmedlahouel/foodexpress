import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { UserService } from '../../core/services/user.service';

@Component({
  selector: 'app-profile',
  imports: [FormsModule],
  template: `
    <div class="container my-4" style="max-width:640px">
      <h2 class="mb-3">Mon profil</h2>

      <div class="card mb-4">
        <div class="card-body">
          <h5>Informations personnelles</h5>
          <div class="mb-2"><label class="form-label">Email</label>
            <input class="form-control" [value]="email()" disabled /></div>
          <div class="mb-2"><label class="form-label">Nom</label>
            <input class="form-control" [ngModel]="nom()" (ngModelChange)="nom.set($event)" /></div>
          <div class="mb-2"><label class="form-label">Prénom</label>
            <input class="form-control" [ngModel]="prenom()" (ngModelChange)="prenom.set($event)" /></div>
          <div class="mb-3"><label class="form-label">Téléphone</label>
            <input class="form-control" [ngModel]="telephone()" (ngModelChange)="telephone.set($event)" /></div>
          @if (infoMsg()) { <div class="alert" [class.alert-success]="!infoErr()" [class.alert-danger]="infoErr()">{{ infoMsg() }}</div> }
          <button class="btn btn-dark" (click)="saveInfo()">Enregistrer</button>
        </div>
      </div>

      <div class="card mb-4">
        <div class="card-body">
          <h5>Changer le mot de passe</h5>
          <div class="mb-2"><label class="form-label">Mot de passe actuel</label>
            <input type="password" class="form-control" [ngModel]="currentPassword()" (ngModelChange)="currentPassword.set($event)" /></div>
          <div class="mb-2"><label class="form-label">Nouveau mot de passe</label>
            <input type="password" class="form-control" [ngModel]="newPassword()" (ngModelChange)="newPassword.set($event)" /></div>
          <div class="mb-3"><label class="form-label">Confirmation</label>
            <input type="password" class="form-control" [ngModel]="confirmation()" (ngModelChange)="confirmation.set($event)" /></div>
          @if (pwdMsg()) { <div class="alert" [class.alert-success]="!pwdErr()" [class.alert-danger]="pwdErr()">{{ pwdMsg() }}</div> }
          <button class="btn btn-dark" (click)="savePassword()">Modifier</button>
        </div>
      </div>

      <button class="btn btn-outline-danger" (click)="logout()">Se déconnecter</button>
    </div>
  `,
})
export class Profile {
  private users = inject(UserService);
  private router = inject(Router);

  email = signal('');
  nom = signal('');
  prenom = signal('');
  telephone = signal('');
  infoMsg = signal('');
  infoErr = signal(false);

  currentPassword = signal('');
  newPassword = signal('');
  confirmation = signal('');
  pwdMsg = signal('');
  pwdErr = signal(false);

  constructor() {
    this.users.me().subscribe((u) => {
      this.email.set(u.email);
      this.nom.set(u.nom);
      this.prenom.set(u.prenom);
      this.telephone.set(u.telephone);
    });
  }

  saveInfo() {
    this.users.update({ nom: this.nom(), prenom: this.prenom(), telephone: this.telephone() }).subscribe({
      next: () => { this.infoErr.set(false); this.infoMsg.set('Profil mis à jour'); },
      error: (e) => { this.infoErr.set(true); this.infoMsg.set(e.error?.message ?? 'Erreur'); },
    });
  }

  savePassword() {
    this.users
      .changePassword({
        currentPassword: this.currentPassword(),
        newPassword: this.newPassword(),
        confirmation: this.confirmation(),
      })
      .subscribe({
        next: (r) => {
          this.pwdErr.set(false);
          this.pwdMsg.set(r.message);
          this.currentPassword.set('');
          this.newPassword.set('');
          this.confirmation.set('');
        },
        error: (e) => { this.pwdErr.set(true); this.pwdMsg.set(e.error?.message ?? 'Erreur'); },
      });
  }

  logout() {
    // TODO: remplacer par le logout() de l'AuthService d'Ahmed (core/services)
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.router.navigate(['/login']);
  }
}
