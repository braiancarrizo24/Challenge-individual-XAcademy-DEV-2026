import {
  Component,
  OnInit,
  inject,
  ChangeDetectorRef,
  effect,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import {
  Players,
  Player,
  PlayersResponse,
} from '../../core/services/players';
import { EditionSelector } from '../../core/components/edition-selector/edition-selector';
import { EditionService } from '../../core/services/edition';

@Component({
  selector: 'app-players-list',
  imports: [CommonModule, FormsModule, EditionSelector, RouterLink],
  templateUrl: './players-list.html',
  styleUrl: './players-list.css',
})
export class PlayersList implements OnInit {
  private readonly playersService = inject(Players);
  private readonly changeDetector = inject(ChangeDetectorRef);
  private readonly editionService = inject(EditionService);

  players: Player[] = [];
  loading = true;
  error = '';

  currentPage = 1;
  pageSize = 30;
  totalPlayers = 0;
  totalPages = 0;

  nameFilter = '';
  clubFilter = '';
  positionFilter = '';

  appliedName = '';
  appliedClub = '';
  appliedPosition = '';

  constructor() {
    effect(() => {
      const edition = this.editionService.selectedEdition();

      this.currentPage = 1;
      this.loadPlayers(edition);
    });
  }

  ngOnInit(): void {}

  searchPlayers(): void {
    this.appliedName = this.nameFilter.trim();
    this.appliedClub = this.clubFilter.trim();
    this.appliedPosition = this.positionFilter.trim();

    this.currentPage = 1;
    this.loadPlayers(this.editionService.selectedEdition());
  }

  loadPlayers(edition: number): void {
    this.loading = true;
    this.error = '';

    this.playersService
      .getPlayers(
        this.currentPage,
        this.pageSize,
        'male',
        edition,
        this.appliedName,
        this.appliedClub,
        this.appliedPosition,
      )
      .subscribe({
        next: (response: PlayersResponse) => {
          this.players = response.data;
          this.totalPlayers = response.total;
          this.currentPage = response.page;
          this.pageSize = response.limit;
          this.totalPages = response.totalPages;
          this.loading = false;

          this.changeDetector.detectChanges();

          console.log('Edición seleccionada:', edition);
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
      this.loadPlayers(this.editionService.selectedEdition());
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.loadPlayers(this.editionService.selectedEdition());
    }
  }
}







