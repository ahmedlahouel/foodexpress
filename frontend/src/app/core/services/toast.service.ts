import { Injectable, signal } from '@angular/core';

export interface ToastMessage {
  id: number;
  text: string;
  type: 'success' | 'danger' | 'info';
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  readonly toasts = signal<ToastMessage[]>([]);
  private nextId = 1;

  show(text: string, type: ToastMessage['type'] = 'success', duration = 3000) {
    const id = this.nextId++;
    this.toasts.update((list) => [...list, { id, text, type }]);
    setTimeout(() => this.remove(id), duration);
  }

  success(text: string) { this.show(text, 'success'); }
  error(text: string) { this.show(text, 'danger', 5000); }
  info(text: string) { this.show(text, 'info'); }

  remove(id: number) {
    this.toasts.update((list) => list.filter((t) => t.id !== id));
  }
}
