import { Component, input } from '@angular/core';

@Component({
  selector: 'app-error-message',
  template: `
    @if (message()) {
      <div class="alert alert-danger" role="alert">{{ message() }}</div>
    }
  `,
})
export class ErrorMessage {
  message = input<string | null>('');
}
