import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Players, PlayerDetail } from '../../core/services/players';

@Component({
  selector: 'app-player-detail',
  standalone: true,
  imports: [CommonModule],
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
}
