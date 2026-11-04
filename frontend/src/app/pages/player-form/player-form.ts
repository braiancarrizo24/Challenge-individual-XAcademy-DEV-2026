
import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import {
  Players,
  CreatePlayerPayload,
  PlayerGender,
} from '../../core/services/players';

@Component({
  selector: 'app-player-form',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './player-form.html',
  styleUrl: './player-form.css',
})
export class PlayerForm {
  private readonly playersService = inject(Players);
  private readonly router = inject(Router);

  name = '';
  gender: PlayerGender = 'male';
  nationality = '';

  edition = 23;
  fifaUpdate = 0;
  age: number | null = null;
  club = '';
  position = '';
  rating: number | null = null;
  potential: number | null = null;
  valueEur = '';
  wageEur = '';

  loading = false;
  error = '';

  skillGroups = [
    {
      title: 'Estadísticas principales',
      skills: [
        { key: 'pace', label: 'Ritmo' },
        { key: 'shooting', label: 'Tiro' },
        { key: 'passing', label: 'Pase' },
        { key: 'dribbling', label: 'Regate' },
        { key: 'defending', label: 'Defensa' },
        { key: 'physic', label: 'Físico' },
      ],
    },
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

  skillValues: Record<string, number> = Object.fromEntries(
    this.skillGroups.flatMap((group) =>
      group.skills.map((skill) => [skill.key, 0])
    )
  );

  createPlayer(): void {
    this.error = '';

    if (!this.name.trim()) {
      this.error = 'Ingresá el nombre del jugador.';
      return;
    }

    if (!Number.isInteger(this.edition) || this.edition < 15 || this.edition > 23) {
      this.error = 'Seleccioná una edición FIFA válida entre 15 y 23.';
      return;
    }

    const skills = Object.entries(this.skillValues).map(
      ([skill, value]) => ({
        skill,
        value: Number(value),
      })
    );

    const payload: CreatePlayerPayload = {
      name: this.name.trim(),
      gender: this.gender,
      nationality: this.nationality.trim(),
      edition: {
        edition: this.edition,
        fifaUpdate: this.fifaUpdate,
        ...(this.age !== null ? { age: this.age } : {}),
        ...(this.club.trim() ? { club: this.club.trim() } : {}),
        ...(this.position.trim() ? { position: this.position.trim() } : {}),
        ...(this.rating !== null ? { rating: this.rating } : {}),
        ...(this.potential !== null ? { potential: this.potential } : {}),
        ...(this.valueEur.trim() ? { valueEur: this.valueEur.trim() } : {}),
        ...(this.wageEur.trim() ? { wageEur: this.wageEur.trim() } : {}),
        skills,
      },
    };

    this.loading = true;

    this.playersService.createPlayer(payload).subscribe({
      next: (player) => {
        this.loading = false;
        this.router.navigate(['/players', player.id]);
      },
      error: (error) => {
        console.error('Error al crear el jugador:', error);

        this.loading = false;
        this.error =
          error.error?.message ||
          'No se pudo crear el jugador. Revisá los datos e intentá nuevamente.';
      },
    });
  }

  cancel(): void {
    this.router.navigate([
      this.gender === 'female' ? '/players-women' : '/players',
    ]);
  }
}
