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
}
