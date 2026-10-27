
import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class EditionService {
  readonly editions: number[] = [15, 16, 17, 18, 19, 20, 21, 22, 23];

  readonly selectedEdition = signal(23);

  selectEdition(edition: number): void {
    if (this.editions.includes(edition)) {
      this.selectedEdition.set(edition);
    }
  }
}
