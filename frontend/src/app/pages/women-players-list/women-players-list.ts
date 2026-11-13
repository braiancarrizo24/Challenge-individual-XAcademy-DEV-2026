
import {
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
  inject,
  effect,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import {
  Subject,
  Subscription,
  forkJoin,
  of,
} from 'rxjs';
import {
  catchError,
  debounceTime,
  switchMap,
} from 'rxjs/operators';

import {
  Players,
  Player,
  PlayersResponse,
  PlayerPositionGroup,
  PlayerSortBy,
  PlayerSortOrder,
} from '../../core/services/players';
import { EditionSelector } from '../../core/components/edition-selector/edition-selector';
import { EditionService } from '../../core/services/edition';
import { Auth } from '../../core/services/auth';

type Theme = 'light' | 'dark';
type Language = 'es' | 'en';
type ViewMode = 'cards' | 'list';

interface SearchResults {
  male: Player[];
  female: Player[];
}

interface PlayerGroup {
  title: string;
  players: Player[];
}

interface SortOption {
  label: string;
  sortBy: PlayerSortBy;
  sortOrder: PlayerSortOrder;
}

@Component({
  selector: 'app-women-players-list',
  imports: [CommonModule, FormsModule, EditionSelector, RouterLink],
  templateUrl: './women-players-list.html',
  styleUrls: [
    './women-players-list.css',
    './women-players-list-responsive.css',
  ],
})
export class WomenPlayersList implements OnInit, OnDestroy {
  private readonly playersService = inject(Players);
  private readonly changeDetector = inject(ChangeDetectorRef);
  private readonly editionService = inject(EditionService);
  private readonly authService = inject(Auth);
  private readonly router = inject(Router);

  private readonly searchSubject = new Subject<void>();
  private searchSubscription?: Subscription;

  isDarkMode = true;
  language: Language = 'es';
  viewMode: ViewMode = 'cards';

  searchName = '';

  searchResults: SearchResults = {
    male: [],
    female: [],
  };

  isSearching = false;
  searchError = false;
  showSearchResults = false;

  players: Player[] = [];
  loading = true;
  exporting = false;
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

  selectedPositionGroup: PlayerPositionGroup | null = null;

  sortOptions: SortOption[] = [
    {
      label: 'Nombre A–Z',
      sortBy: 'name',
      sortOrder: 'ASC',
    },
    {
      label: 'Nombre Z–A',
      sortBy: 'name',
      sortOrder: 'DESC',
    },
    {
      label: 'Media menor a mayor',
      sortBy: 'rating',
      sortOrder: 'ASC',
    },
    {
      label: 'Media mayor a menor',
      sortBy: 'rating',
      sortOrder: 'DESC',
    },
  ];

  selectedSort = 'name-asc';

  constructor() {
    effect(() => {
      const edition = this.editionService.selectedEdition();

      this.currentPage = 1;
      this.loadPlayers(edition);
    });
  }

  get playerGroups(): PlayerGroup[] {
    return [
      {
        title: 'Arqueras',
        players: this.players.filter((player) =>
          this.matchesPosition(player.position, [
            'GK',
            'GOALKEEPER',
            'PORTERO',
            'ARQUERO',
          ])
        ),
      },
      {
        title: 'Defensas',
        players: this.players.filter((player) =>
          this.matchesPosition(player.position, [
            'CB',
            'LB',
            'RB',
            'LWB',
            'RWB',
            'SW',
            'DEF',
            'DEFENDER',
            'DEFENSA',
          ])
        ),
      },
      {
        title: 'Mediocampistas',
        players: this.players.filter((player) =>
          this.matchesPosition(player.position, [
            'CDM',
            'CM',
            'CAM',
            'LM',
            'RM',
            'MID',
            'MIDFIELDER',
            'MEDIOCAMPISTA',
          ])
        ),
      },
      {
        title: 'Delanteras',
        players: this.players.filter((player) =>
          this.matchesPosition(player.position, [
            'ST',
            'CF',
            'LW',
            'RW',
            'LF',
            'RF',
            'FW',
            'FORWARD',
            'DELANTERO',
          ])
        ),
      },
      {
        title: 'Otras posiciones',
        players: this.players.filter(
          (player) => !this.getPositionGroup(player.position)
        ),
      },
    ];
  }

  ngOnInit(): void {
    this.loadPreferences();
    this.applyTheme();
    this.initializeSearch();
  }

  ngOnDestroy(): void {
    this.searchSubscription?.unsubscribe();
    this.searchSubject.complete();
  }

  setViewMode(mode: ViewMode): void {
    this.viewMode = mode;
  }

  selectPositionGroup(group: PlayerPositionGroup | null): void {
    this.selectedPositionGroup = group;
    this.currentPage = 1;
    this.loadPlayers(this.editionService.selectedEdition());
  }

  onSortChange(value: string): void {
    this.selectedSort = value.toLowerCase();
    this.currentPage = 1;
    this.loadPlayers(this.editionService.selectedEdition());
  }

  private getSortConfiguration(): {
    sortBy: PlayerSortBy;
    sortOrder: PlayerSortOrder;
  } {
    const selectedOption = this.sortOptions.find(
      (option) =>
        `${option.sortBy}-${option.sortOrder.toLowerCase()}` ===
        this.selectedSort
    );

    return selectedOption
      ? {
          sortBy: selectedOption.sortBy,
          sortOrder: selectedOption.sortOrder,
        }
      : {
          sortBy: 'name',
          sortOrder: 'ASC',
        };
  }

  getPlayerInitials(name: string): string {
    return name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join('');
  }

  private getPositionGroup(position: string | null): string | null {
    if (!position) {
      return null;
    }

    const normalized = position.trim().toUpperCase();

    const goalkeeperPositions = [
      'GK',
      'GOALKEEPER',
      'PORTERO',
      'ARQUERO',
    ];

    const defenderPositions = [
      'CB',
      'LB',
      'RB',
      'LWB',
      'RWB',
      'SW',
      'DEF',
      'DEFENDER',
      'DEFENSA',
    ];

    const midfielderPositions = [
      'CDM',
      'CM',
      'CAM',
      'LM',
      'RM',
      'MID',
      'MIDFIELDER',
      'MEDIOCAMPISTA',
    ];

    const forwardPositions = [
      'ST',
      'CF',
      'LW',
      'RW',
      'LF',
      'RF',
      'FW',
      'FORWARD',
      'DELANTERO',
    ];

    if (goalkeeperPositions.includes(normalized)) {
      return 'goalkeeper';
    }

    if (defenderPositions.includes(normalized)) {
      return 'defender';
    }

    if (midfielderPositions.includes(normalized)) {
      return 'midfielder';
    }

    if (forwardPositions.includes(normalized)) {
      return 'forward';
    }

    return null;
  }

  private matchesPosition(
    position: string | null,
    acceptedPositions: string[],
  ): boolean {
    if (!position) {
      return false;
    }

    return acceptedPositions.includes(position.trim().toUpperCase());
  }

  isAuthenticated(): boolean {
    return this.authService.isAuthenticated();
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/']);
  }

  setTheme(dark: boolean): void {
    this.isDarkMode = dark;
    this.applyTheme();

    localStorage.setItem(
      'fifa-stats-theme',
      dark ? 'dark' : 'light'
    );
  }

  toggleTheme(): void {
    this.setTheme(!this.isDarkMode);
  }

  toggleLanguage(): void {
    this.language = this.language === 'es' ? 'en' : 'es';

    localStorage.setItem(
      'fifa-stats-language',
      this.language
    );
  }

  onSearchNameChange(value: string): void {
    this.searchName = value;
    this.scheduleSearch();
  }

  clearSearch(): void {
    this.searchName = '';

    this.searchResults = {
      male: [],
      female: [],
    };

    this.showSearchResults = false;
    this.searchError = false;
    this.isSearching = false;

    this.searchSubject.next();
  }

  private scheduleSearch(): void {
    const hasSearchCriteria = Boolean(this.searchName.trim());

    this.showSearchResults = hasSearchCriteria;
    this.searchError = false;

    if (!hasSearchCriteria) {
      this.searchResults = {
        male: [],
        female: [],
      };
    }

    this.searchSubject.next();
  }

  private initializeSearch(): void {
    this.searchSubscription = this.searchSubject
      .pipe(
        debounceTime(300),
        switchMap(() => {
          const name = this.searchName.trim();

          if (!name) {
            return of(null);
          }

          this.isSearching = true;
          this.searchError = false;

          const selectedEdition =
            this.editionService.selectedEdition();

          return forkJoin({
            male: this.playersService.getPlayers(
              1,
              8,
              'male',
              selectedEdition,
              name
            ),
            female: this.playersService.getPlayers(
              1,
              8,
              'female',
              selectedEdition,
              name
            ),
          }).pipe(
            catchError(() => {
              this.searchError = true;

              return of({
                male: { data: [] },
                female: { data: [] },
              });
            })
          );
        })
      )
      .subscribe((response) => {
        this.isSearching = false;

        if (!response) {
          return;
        }

        this.searchResults = {
          male: response.male.data,
          female: response.female.data,
        };
      });
  }

  private loadPreferences(): void {
    const savedTheme = localStorage.getItem('fifa-stats-theme');
    const savedLanguage = localStorage.getItem('fifa-stats-language');

    if (savedTheme === 'light' || savedTheme === 'dark') {
      this.isDarkMode = savedTheme === 'dark';
    }

    if (savedLanguage === 'es' || savedLanguage === 'en') {
      this.language = savedLanguage;
    }
  }

  private applyTheme(): void {
    const theme: Theme = this.isDarkMode ? 'dark' : 'light';

    document.documentElement.setAttribute('data-theme', theme);
  }

  scrollToTop(): void {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  }

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

    const sort = this.getSortConfiguration();

    this.playersService
      .getPlayers(
        this.currentPage,
        this.pageSize,
        'female',
        edition,
        this.appliedName,
        this.appliedClub,
        this.appliedPosition,
        this.selectedPositionGroup ?? undefined,
        sort.sortBy,
        sort.sortOrder,
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
        },
        error: (err) => {
          console.error('Error al cargar jugadoras:', err);

          this.error = 'No se pudieron cargar las jugadoras.';
          this.loading = false;

          this.changeDetector.detectChanges();
        },
      });
  }

  exportCsv(): void {
    if (this.exporting) {
      return;
    }

    this.exporting = true;
    this.error = '';

    const sort = this.getSortConfiguration();

    this.playersService
      .getPlayersForExport(
        'female',
        this.editionService.selectedEdition(),
        this.appliedName,
        this.appliedClub,
        this.appliedPosition,
        this.selectedPositionGroup ?? undefined,
        sort.sortBy,
        sort.sortOrder,
      )
      .subscribe({
        next: (response: PlayersResponse) => {
          const headers = [
            'Nombre',
            'Género',
            'Nacionalidad',
            'Edición FIFA',
            'Actualización FIFA',
            'Edad',
            'Club',
            'Posición',
            'Calificación',
            'Potencial',
            'Valor EUR',
            'Salario EUR',
          ];

          const rows = response.data.map((player) => [
            player.name,
            player.gender,
            player.nationality,
            player.edition,
            player.fifaUpdate,
            player.age,
            player.club,
            player.position,
            player.rating,
            player.potential,
            player.valueEur,
            player.wageEur,
          ]);

          const escapeCsvValue = (value: string | number | null): string => {
            const text = value === null ? '' : String(value);
            return `"${text.replace(/"/g, '""')}"`;
          };

          const csvContent = [
            headers.map(escapeCsvValue).join(','),
            ...rows.map((row) => row.map(escapeCsvValue).join(',')),
          ].join('\r\n');

          const blob = new Blob(
            ['\uFEFF', csvContent],
            { type: 'text/csv;charset=utf-8;' },
          );

          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');

          link.href = url;
          link.download = 'jugadoras-fifa.csv';
          link.click();

          URL.revokeObjectURL(url);

          this.exporting = false;
          this.changeDetector.detectChanges();

          console.log('Jugadoras exportadas:', response.total);
        },
        error: (err) => {
          console.error('Error al exportar jugadoras:', err);

          this.error = 'No se pudo generar el archivo CSV.';
          this.exporting = false;

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




