import { Component, input } from '@angular/core';

@Component({
  selector: 'app-loading',
  template: `
    <div class="d-flex justify-content-center align-items-center py-5">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Chargement...</span>
      </div>
      @if (message()) {
        <span class="ms-3">{{ message() }}</span>
      }
    </div>
  `,
})
export class Loading {
  message = input('');
}
