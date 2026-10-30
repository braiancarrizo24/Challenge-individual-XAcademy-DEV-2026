
import {
  Component,
  OnInit,
  inject,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  Players,
  Player,
  PlayersResponse,
} from '../../core/services/players';

@Component({
  selector: 'app-players-list',
  imports: [CommonModule],
  templateUrl: './players-list.html',
  styleUrl: './players-list.css',
})
export class PlayersList implements OnInit {
  private readonly playersService = inject(Players);
  private readonly changeDetector = inject(ChangeDetectorRef);

  players: Player[] = [];
  loading = true;
  error = '';

  currentPage = 1;
  pageSize = 25;
  totalPlayers = 0;
  totalPages = 0;

  ngOnInit(): void {
    this.loadPlayers();
  }

  loadPlayers(): void {
    this.loading = true;
    this.error = '';

    this.playersService
      .getPlayers(this.currentPage, this.pageSize, 'male')
      .subscribe({
        next: (response: PlayersResponse) => {
          this.players = response.data;
          this.totalPlayers = response.total;
          this.currentPage = response.page;
          this.pageSize = response.limit;
          this.totalPages = response.totalPages;
          this.loading = false;

          this.changeDetector.detectChanges();

          console.log('Jugadores recibidos:', this.players.length);
          console.log('Total de jugadores:', this.totalPlayers);
        },
        error: (err) => {
          console.error('Error al cargar jugadores:', err);

          this.error = 'No se pudieron cargar los jugadores.';
          this.loading = false;

          this.changeDetector.detectChanges();
        },
      });
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.loadPlayers();
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.loadPlayers();
    }
  }
}




