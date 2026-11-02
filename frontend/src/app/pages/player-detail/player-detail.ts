import {
  CommonModule,
} from '@angular/common';
import {
  Component,
  OnInit,
  inject,
  ChangeDetectorRef,
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import {
  Players,
  PlayerDetail,
  PlayerEdition,
} from '../../core/services/players';
import { EditionSelector } from '../../core/components/edition-selector/edition-selector';

@Component({
  selector: 'app-player-detail',
  standalone: true,
  imports: [CommonModule, EditionSelector],
  templateUrl: './player-detail.html',
  styleUrl: './player-detail.css',
})
export class PlayerDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly playersService = inject(Players);
  private readonly changeDetector = inject(ChangeDetectorRef);

  player: PlayerDetail | null = null;
  loading = true;
  error = '';

  selectedEditions: number[] = [];

  get availableEditions(): number[] {
    return this.player?.editions.map((edition) => edition.edition) ?? [];
  }

  get selectedEditionData(): PlayerEdition[] {
    if (!this.player) {
      return [];
    }

    return this.player.editions.filter((edition) =>
      this.selectedEditions.includes(edition.edition)
    );
  }

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));

    if (!Number.isInteger(id) || id <= 0) {
      this.error = 'El identificador del jugador no es válido.';
      this.loading = false;
      this.changeDetector.detectChanges();
      return;
    }

    this.playersService.getPlayerById(id).subscribe({
      next: (player) => {
        this.player = player;

        const latestEdition = Math.max(
          ...player.editions.map((edition) => edition.edition)
        );

        this.selectedEditions = player.editions.length > 0
          ? [latestEdition]
          : [];

        this.loading = false;
        this.changeDetector.detectChanges();
      },
      error: (error) => {
        console.error('Error al obtener el jugador:', error);

        this.error = 'No se pudo cargar la información del jugador.';
        this.loading = false;
        this.changeDetector.detectChanges();
      },
    });
  }

  onEditionsChange(editions: number[]): void {
    this.selectedEditions = editions;
    this.changeDetector.detectChanges();
  }
}

