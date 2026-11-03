
import { CommonModule } from '@angular/common';
import {
  Component,
  OnInit,
  OnDestroy,
  inject,
  ChangeDetectorRef,
} from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { BaseChartDirective } from 'ng2-charts';
import {
  Chart,
  ChartData,
  ChartOptions,
  RadarController,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from 'chart.js';
import {
  Players,
  PlayerDetail,
  PlayerEdition,
} from '../../core/services/players';
import { EditionSelector } from '../../core/components/edition-selector/edition-selector';
import { EditionService } from '../../core/services/edition';

@Component({
  selector: 'app-player-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, EditionSelector, BaseChartDirective],
  templateUrl: './player-detail.html',
  styleUrl: './player-detail.css',
})
export class PlayerDetailComponent implements OnInit, OnDestroy {
  static {
    Chart.register(
      RadarController,
      RadialLinearScale,
      PointElement,
      LineElement,
      Filler,
      Tooltip,
      Legend
    );
  }

  private readonly route = inject(ActivatedRoute);
  private readonly playersService = inject(Players);
  private readonly editionService = inject(EditionService);
  private readonly changeDetector = inject(ChangeDetectorRef);

  private themeObserver?: MutationObserver;

  isDarkMode = true;
  language: 'es' | 'en' = 'es';

  player: PlayerDetail | null = null;
  loading = true;
  error = '';

  comparisonEditions: number[] = [];

  radarChartLabels: string[] = [
    'Ritmo',
    'Tiro',
    'Pase',
    'Regate',
    'Defensa',
    'Físico',
  ];

  radarChartOptions: ChartOptions<'radar'> = {};

  skillGroups = [
    {
      title: 'Ritmo',
      skills: [
        { key: 'movement_acceleration', label: 'Aceleración' },
        { key: 'movement_sprint_speed', label: 'Velocidad de sprint' },
      ],
    },
    {
      title: 'Tiro',
      skills: [
        { key: 'attacking_finishing', label: 'Definición' },
        { key: 'power_shot_power', label: 'Potencia de tiro' },
        { key: 'power_long_shots', label: 'Tiros lejanos' },
        { key: 'attacking_heading_accuracy', label: 'Precisión de cabeza' },
        { key: 'attacking_volleys', label: 'Voleas' },
        { key: 'mentality_penalties', label: 'Penales' },
      ],
    },
    {
      title: 'Pase',
      skills: [
        { key: 'attacking_crossing', label: 'Centros' },
        { key: 'attacking_short_passing', label: 'Pase corto' },
        { key: 'skill_long_passing', label: 'Pase largo' },
        { key: 'mentality_vision', label: 'Visión' },
        { key: 'skill_fk_accuracy', label: 'Precisión en tiros libres' },
        { key: 'skill_curve', label: 'Efecto' },
      ],
    },
    {
      title: 'Regate',
      skills: [
        { key: 'skill_ball_control', label: 'Control de balón' },
        { key: 'skill_dribbling', label: 'Regate' },
        { key: 'movement_agility', label: 'Agilidad' },
        { key: 'movement_balance', label: 'Equilibrio' },
        { key: 'skill_moves', label: 'Filigranas' },
      ],
    },
    {
      title: 'Defensa',
      skills: [
        { key: 'defending_marking_awareness', label: 'Marcaje' },
        { key: 'defending_sliding_tackle', label: 'Entrada deslizante' },
        { key: 'defending_standing_tackle', label: 'Entrada' },
        { key: 'mentality_interceptions', label: 'Intercepciones' },
      ],
    },
    {
      title: 'Físico',
      skills: [
        { key: 'power_strength', label: 'Fuerza' },
        { key: 'power_stamina', label: 'Resistencia' },
        { key: 'power_jumping', label: 'Salto' },
        { key: 'mentality_aggression', label: 'Agresividad' },
      ],
    },
  ];

  get availableEditions(): number[] {
    return this.player?.editions.map((edition) => edition.edition) ?? [];
  }

  get selectedEditionData(): PlayerEdition[] {
    if (!this.player) {
      return [];
    }

    return this.player.editions.filter(
      (edition) =>
        edition.edition === this.editionService.selectedEdition()
    );
  }

  get comparisonEditionData(): PlayerEdition[] {
    if (!this.player) {
      return [];
    }

    return this.player.editions
      .filter((edition) =>
        this.comparisonEditions.includes(edition.edition)
      )
      .sort((a, b) => a.edition - b.edition);
  }

  getSkillValue(
    edition: PlayerEdition,
    skillKey: string
  ): number | null {
    const skill = edition.skills.find(
      (item) => item.skill === skillKey
    );

    if (!skill) {
      return null;
    }

    const value = Number(skill.value);

    return Number.isFinite(value) ? value : null;
  }

  getOverallSkillValue(
    edition: PlayerEdition,
    index: number
  ): number | null {
    const attributes = [
      'pace',
      'shooting',
      'passing',
      'dribbling',
      'defending',
      'physic',
    ];

    return this.getSkillValue(edition, attributes[index]);
  }

  getRadarChartOptions(): ChartOptions<'radar'> {
    const styles = getComputedStyle(document.documentElement);
    const textColor = styles.getPropertyValue('--text-secondary').trim();
    const primaryTextColor = styles.getPropertyValue('--text-primary').trim();
    const borderColor = styles.getPropertyValue('--border-color').trim();

    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false,
          labels: {
            color: primaryTextColor,
          },
        },
        tooltip: {
          backgroundColor: styles.getPropertyValue('--surface-bg').trim(),
          titleColor: primaryTextColor,
          bodyColor: primaryTextColor,
          borderColor,
          borderWidth: 1,
        },
      },
      scales: {
        r: {
          min: 0,
          max: 100,
          angleLines: {
            color: borderColor,
          },
          grid: {
            color: borderColor,
          },
          pointLabels: {
            color: primaryTextColor,
            font: {
              size: 11,
              weight: 'bold',
            },
          },
          ticks: {
            stepSize: 20,
            color: textColor,
            backdropColor: 'transparent',
            showLabelBackdrop: false,
          },
        },
      },
    };
  }

  getRadarChartData(edition: PlayerEdition): ChartData<'radar'> {
    const accentColor = getComputedStyle(
      document.documentElement
    ).getPropertyValue('--accent-color').trim();

    const attributes = [
      'pace',
      'shooting',
      'passing',
      'dribbling',
      'defending',
      'physic',
    ];

    const values = attributes.map((attribute) => {
      const skill = edition.skills.find(
        (item) => item.skill === attribute
      );

      return skill ? Number(skill.value) : 0;
    });

    return {
      labels: this.radarChartLabels,
      datasets: [
        {
          data: values,
          label: `FIFA ${edition.edition}`,
          fill: true,
          backgroundColor: `${accentColor}33`,
          borderColor: accentColor,
          pointBackgroundColor: accentColor,
          pointBorderColor: primaryColor(),
          pointHoverBackgroundColor: primaryColor(),
          pointHoverBorderColor: accentColor,
          borderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6,
        },
      ],
    };
  }

  ngOnInit(): void {
    this.loadPreferences();
    this.applyTheme();

    this.radarChartOptions = this.getRadarChartOptions();

    this.themeObserver = new MutationObserver(() => {
      this.updateChartsTheme();
    });

    this.themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    });

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

        if (player.editions.length > 0) {
          const latestEdition = Math.max(
            ...player.editions.map((edition) => edition.edition)
          );

          this.editionService.selectEdition(latestEdition);
        }

        this.comparisonEditions = [];

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

  setTheme(dark: boolean): void {
    this.isDarkMode = dark;
    this.applyTheme();

    localStorage.setItem(
      'fifa-stats-theme',
      dark ? 'dark' : 'light'
    );
  }

  applyTheme(): void {
    document.documentElement.setAttribute(
      'data-theme',
      this.isDarkMode ? 'dark' : 'light'
    );
  }

  loadPreferences(): void {
    const savedTheme = localStorage.getItem('fifa-stats-theme');
    const savedLanguage = localStorage.getItem('fifa-stats-language');

    this.isDarkMode = savedTheme
      ? savedTheme === 'dark'
      : true;

    this.language = savedLanguage === 'en' ? 'en' : 'es';
  }

  toggleLanguage(): void {
    this.language = this.language === 'es' ? 'en' : 'es';

    localStorage.setItem(
      'fifa-stats-language',
      this.language
    );
  }

  scrollToTop(): void {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  }

  updateChartsTheme(): void {
    this.radarChartOptions = this.getRadarChartOptions();
    this.changeDetector.detectChanges();
  }

  onComparisonEditionsChange(editions: number[]): void {
    this.comparisonEditions = editions;
    this.changeDetector.detectChanges();
  }

  ngOnDestroy(): void {
    this.themeObserver?.disconnect();
  }
}

function primaryColor(): string {
  return getComputedStyle(document.documentElement)
    .getPropertyValue('--surface-bg')
    .trim();
}










