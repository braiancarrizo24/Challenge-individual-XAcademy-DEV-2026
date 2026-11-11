
import {
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
  effect,
  inject,
} from '@angular/core';
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
  map,
  switchMap,
} from 'rxjs/operators';

import { EditionSelector } from '../../core/components/edition-selector/edition-selector';
import { Auth } from '../../core/services/auth';
import { EditionService } from '../../core/services/edition';
import {
  Player,
  PlayerDetail,
  Players,
} from '../../core/services/players';

type Theme = 'light' | 'dark';
type Language = 'es' | 'en';

interface SearchResults {
  male: Player[];
  female: Player[];
}

interface RadarStat {
  label: string;
  value: number;
}

interface DetailedStat {
  label: string;
  value: number;
}

interface HomePlayer extends Player {
  radarStats: RadarStat[];
  radarPoints: string;
  detailedStats: DetailedStat[];
}

interface HomePlayersData {
  featured: HomePlayer[];
  topRatedPlayers: HomePlayer[];
  topRatedWomen: HomePlayer[];
}

@Component({
  imports: [RouterLink, EditionSelector],
  selector: 'app-home',
  styleUrls: ['./home.css', './home-responsive.css'],
  templateUrl: './home.html',
})
export class Home implements OnInit, OnDestroy {
  private readonly authService = inject(Auth);
  private readonly router = inject(Router);
  private readonly playersService = inject(Players);
  private readonly editionService = inject(EditionService);
  private readonly changeDetectorRef = inject(ChangeDetectorRef);

  private readonly searchSubject = new Subject<void>();
  private searchSubscription?: Subscription;

  isDarkMode = true;
  language: Language = 'es';

  searchName = '';

  searchResults: SearchResults = {
    male: [],
    female: [],
  };

  isSearching = false;
  searchError = false;
  showSearchResults = false;

  featuredPlayers: HomePlayer[] = [];
  topRatedPlayers: HomePlayer[] = [];
  topRatedWomen: HomePlayer[] = [];

  private readonly editionPlayersEffect = effect((onCleanup) => {
    const edition = this.editionService.selectedEdition();

    const subscription = this.loadEditionPlayers(edition);

    onCleanup(() => subscription.unsubscribe());
  });

  ngOnInit(): void {
    this.loadPreferences();
    this.applyTheme();
    this.initializeSearch();
  }

  ngOnDestroy(): void {
    this.searchSubscription?.unsubscribe();
    this.searchSubject.complete();
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

  private loadEditionPlayers(edition: number): Subscription {
    return forkJoin({
      male: this.playersService.getPlayersForExport(
        'male',
        edition
      ),
      female: this.playersService.getPlayersForExport(
        'female',
        edition
      ),
    })
      .pipe(
        map(({ male, female }) => {
          const latestMale = this.getLatestPlayers(male.data);
          const latestFemale = this.getLatestPlayers(female.data);

          const featured = this.selectRandomPlayers(
            [...latestMale, ...latestFemale].filter(
              (player) => (player.rating ?? 0) >= 84
            ),
            2
          );

          const topRatedPlayers = this.getTopRatedPlayers(
            latestMale,
            2
          );

          const topRatedWomen = this.getTopRatedPlayers(
            latestFemale,
            2
          );

          return {
            featured,
            topRatedPlayers,
            topRatedWomen,
          };
        }),
        switchMap((selection) => {
          const selectedPlayers = [
            ...selection.featured,
            ...selection.topRatedPlayers,
            ...selection.topRatedWomen,
          ];

          const uniquePlayers = [
            ...new Map(
              selectedPlayers.map((player) => [
                player.id,
                player,
              ])
            ).values(),
          ];

          if (uniquePlayers.length === 0) {
            return of({
              featured: [],
              topRatedPlayers: [],
              topRatedWomen: [],
            } as HomePlayersData);
          }

          return forkJoin(
            uniquePlayers.map((player) =>
              this.playersService.getPlayerById(player.id).pipe(
                map((detail) => ({
                  player,
                  homePlayer: this.buildHomePlayer(
                    player,
                    detail
                  ),
                })),
                catchError(() =>
                  of({
                    player,
                    homePlayer: this.buildHomePlayer(
                      player,
                      null
                    ),
                  })
                )
              )
            )
          ).pipe(
            map((details) => {
              const playersById = new Map(
                details.map(({ player, homePlayer }) => [
                  player.id,
                  homePlayer,
                ])
              );

              return {
                featured: selection.featured.map(
                  (player) => playersById.get(player.id)!
                ),
                topRatedPlayers: selection.topRatedPlayers.map(
                  (player) => playersById.get(player.id)!
                ),
                topRatedWomen: selection.topRatedWomen.map(
                  (player) => playersById.get(player.id)!
                ),
              };
            })
          );
        }),
        catchError(() =>
          of({
            featured: [],
            topRatedPlayers: [],
            topRatedWomen: [],
          })
        )
      )
      .subscribe((data) => {
        this.featuredPlayers = data.featured;
        this.topRatedPlayers = data.topRatedPlayers;
        this.topRatedWomen = data.topRatedWomen;

        this.changeDetectorRef.markForCheck();
      });
  }

  private getLatestPlayers(players: Player[]): Player[] {
    const latestById = new Map<number, Player>();

    for (const player of players) {
      if (player.id === 51335) {
        continue;
      }

      const current = latestById.get(player.id);

      if (
        !current ||
        player.fifaUpdate > current.fifaUpdate ||
        (
          player.fifaUpdate === current.fifaUpdate &&
          player.playerEditionId > current.playerEditionId
        )
      ) {
        latestById.set(player.id, player);
      }
    }

    return [...latestById.values()].filter(
      (player) => player.rating !== null
    );
  }

  private selectRandomPlayers(
    players: Player[],
    quantity: number
  ): Player[] {
    const shuffled = [...players];

    for (let index = shuffled.length - 1; index > 0; index--) {
      const randomIndex = Math.floor(
        Math.random() * (index + 1)
      );

      [shuffled[index], shuffled[randomIndex]] = [
        shuffled[randomIndex],
        shuffled[index],
      ];
    }

    return shuffled.slice(0, quantity);
  }

  private getTopRatedPlayers(
    players: Player[],
    quantity: number
  ): Player[] {
    return [...players]
      .filter((player) => player.rating !== null)
      .sort(
        (a, b) =>
          (b.rating ?? 0) - (a.rating ?? 0) ||
          a.name.localeCompare(b.name)
      )
      .slice(0, quantity);
  }

  private buildHomePlayer(
    player: Player,
    detail: PlayerDetail | null
  ): HomePlayer {
    const edition = detail?.editions.find(
      (item) => item.id === player.playerEditionId
    );

    const skills = new Map(
      (edition?.skills ?? []).map((skill) => [
        skill.skill,
        Number(skill.value),
      ])
    );

    const getValue = (skill: string): number =>
      skills.get(skill) ?? 0;

    const isGoalkeeper = player.position === 'GK';

    const radarStats: RadarStat[] = isGoalkeeper
      ? [
          {
            label: 'Estirada',
            value: getValue('goalkeeping_diving'),
          },
          {
            label: 'Manejo',
            value: getValue('goalkeeping_handling'),
          },
          {
            label: 'Saque',
            value: getValue('goalkeeping_kicking'),
          },
          {
            label: 'Reflejos',
            value: getValue('goalkeeping_reflexes'),
          },
          {
            label: 'Velocidad',
            value: getValue('goalkeeping_speed'),
          },
          {
            label: 'Posicionamiento',
            value: getValue('goalkeeping_positioning'),
          },
        ]
      : [
          { label: 'Ritmo', value: getValue('pace') },
          { label: 'Tiro', value: getValue('shooting') },
          { label: 'Pase', value: getValue('passing') },
          { label: 'Regate', value: getValue('dribbling') },
          { label: 'Defensa', value: getValue('defending') },
          { label: 'Físico', value: getValue('physic') },
        ];

    return {
      ...player,
      radarStats,
      radarPoints: this.getRadarPoints(radarStats),
      detailedStats: [
        {
          label: 'Aceleración',
          value: getValue('movement_acceleration'),
        },
        {
          label: 'Velocidad de sprint',
          value: getValue('movement_sprint_speed'),
        },
        {
          label: 'Definición',
          value: getValue('attacking_finishing'),
        },
        {
          label: 'Potencia de tiro',
          value: getValue('power_shot_power'),
        },
        {
          label: 'Pase corto',
          value: getValue('attacking_short_passing'),
        },
        {
          label: 'Visión',
          value: getValue('mentality_vision'),
        },
        {
          label: 'Control de balón',
          value: getValue('skill_ball_control'),
        },
        {
          label: 'Regate',
          value: getValue('skill_dribbling'),
        },
        {
          label: 'Fuerza',
          value: getValue('power_strength'),
        },
      ],
    };
  }

  getRadarPoints(stats: RadarStat[]): string {
    const centerX = 150;
    const centerY = 129;
    const radius = 104;

    return stats
      .map((stat, index) => {
        const angle = (-90 + index * 60) * (Math.PI / 180);
        const value = Math.max(0, Math.min(100, stat.value));
        const scaledRadius = (value / 100) * radius;
        const x = centerX + Math.cos(angle) * scaledRadius;
        const y = centerY + Math.sin(angle) * scaledRadius;

        return `${x},${y}`;
      })
      .join(' ');
  }

  private scheduleSearch(): void {
    const hasSearchCriteria = this.hasSearchCriteria();

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

  private hasSearchCriteria(): boolean {
    return Boolean(this.searchName.trim());
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
}


















