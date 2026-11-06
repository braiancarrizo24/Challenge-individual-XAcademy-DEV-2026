
import {
  Component,
  inject,
  Input,
  Output,
  EventEmitter,
  OnChanges,
  SimpleChanges,
  signal,
} from '@angular/core';
import { EditionService } from '../../services/edition';

@Component({
  selector: 'app-edition-selector',
  standalone: true,
  templateUrl: './edition-selector.html',
  styleUrl: './edition-selector.css',
})
export class EditionSelector implements OnChanges {
  readonly editionService = inject(EditionService);

  @Input() localMode = false;
  @Input() selectedEditions: number[] = [];
  @Input() availableEditions: number[] = [];

  @Output() selectedEditionsChange = new EventEmitter<number[]>();

  private readonly visibleStartIndexState = signal(0);

  get visibleStartIndex(): number {
    return this.visibleStartIndexState();
  }

  readonly visibleEditionsCount = 3;
  readonly maxSelectedEditions = 3;

  get editions(): number[] {
    if (this.localMode && this.availableEditions.length > 0) {
      return [...this.availableEditions].sort((a, b) => a - b);
    }

    return this.editionService.editions;
  }

  get visibleEditions(): number[] {
    if (this.localMode) {
      return this.editions;
    }

    return this.editions.slice(
      this.visibleStartIndex,
      this.visibleStartIndex + this.visibleEditionsCount
    );
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (this.localMode) {
      return;
    }

    const firstAvailableEditionsChange =
      changes['availableEditions']?.firstChange;

    if (changes['localMode'] || firstAvailableEditionsChange) {
      this.showSelectedEdition();
    }
  }

  showSelectedEdition(): void {
    const selectedEdition = this.editionService.selectedEdition();
    const selectedIndex = this.editions.indexOf(selectedEdition);

    if (selectedIndex !== -1) {
      this.visibleStartIndexState.set(
        Math.min(
          selectedIndex,
          Math.max(0, this.editions.length - this.visibleEditionsCount)
        )
      );
    }
  }

  isSelected(edition: number): boolean {
    if (this.localMode) {
      return this.selectedEditions.includes(edition);
    }

    return this.editionService.selectedEdition() === edition;
  }

  selectEdition(edition: number): void {
    if (!this.localMode) {
      this.editionService.selectEdition(edition);
      this.showSelectedEdition();
      return;
    }

    const alreadySelected = this.selectedEditions.includes(edition);

    if (alreadySelected) {
      this.selectedEditionsChange.emit(
        this.selectedEditions.filter((item) => item !== edition)
      );
      return;
    }

    if (this.selectedEditions.length < this.maxSelectedEditions) {
      this.selectedEditionsChange.emit([
        ...this.selectedEditions,
        edition,
      ]);
    }
  }

  previousEditions(): void {
    if (this.visibleStartIndex > 0) {
      this.visibleStartIndexState.update((index) => index - 1);
    }
  }

  nextEditions(): void {
    const lastStartIndex =
      this.editions.length - this.visibleEditionsCount;

    if (this.visibleStartIndex < lastStartIndex) {
      this.visibleStartIndexState.update((index) => index + 1);
    }
  }
}







