import { Component, inject } from '@angular/core';
import { ToastService } from '../core/services/toast.service';

@Component({
  selector: 'app-toast-container',
  template: `
    <div class="toast-container position-fixed top-0 end-0 p-3">
      @for (t of toastService.toasts(); track t.id) {
        <div [class]="'toast show align-items-center border-0 text-bg-' + t.type" role="alert">
          <div class="d-flex">
            <div class="toast-body">{{ t.text }}</div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto"
                    aria-label="Fermer" (click)="toastService.remove(t.id)"></button>
          </div>
        </div>
      }
    </div>
  `,
})
export class ToastContainer {
  toastService = inject(ToastService);
}
