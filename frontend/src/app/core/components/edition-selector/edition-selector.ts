
import { Component, inject } from '@angular/core';
import { EditionService } from '../../services/edition';

@Component({
  selector: 'app-edition-selector',
  standalone: true,
  templateUrl: './edition-selector.html',
  styleUrl: './edition-selector.css',
})
export class EditionSelector {
  readonly editionService = inject(EditionService);

  visibleStartIndex = 0;
  readonly visibleEditionsCount = 3;

  get visibleEditions(): number[] {
    return this.editionService.editions.slice(
      this.visibleStartIndex,
      this.visibleStartIndex + this.visibleEditionsCount
    );
  }

  previousEditions(): void {
    if (this.visibleStartIndex > 0) {
      this.visibleStartIndex--;
    }
  }

  nextEditions(): void {
    const lastStartIndex =
      this.editionService.editions.length - this.visibleEditionsCount;

    if (this.visibleStartIndex < lastStartIndex) {
      this.visibleStartIndex++;
    }
  }
}
