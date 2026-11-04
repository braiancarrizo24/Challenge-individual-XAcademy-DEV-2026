
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Player {
  id: number;
  playerEditionId: number;
  sourcePlayerId: number;
  name: string;
  nationality: string | null;
  gender: string;
  edition: number;
  fifaUpdate: number;
  age: number | null;
  club: string | null;
  position: string | null;
  rating: number | null;
  potential: number | null;
  valueEur: string | null;
  wageEur: string | null;
}

export interface PlayersResponse {
  data: Player[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PlayerSkill {
  skill: string;
  value: string | number;
}

export interface PlayerEdition {
  id: number;
  edition: number;
  fifaUpdate: number;
  age: number | null;
  club: string | null;
  position: string | null;
  rating: number | null;
  potential: number | null;
  valueEur: string | null;
  wageEur: string | null;
  skills: PlayerSkill[];
}

export interface PlayerDetail {
  id: number;
  sourcePlayerId: number;
  name: string;
  nationality: string | null;
  gender: string;
  editions: PlayerEdition[];
}

export interface CreatePlayerSkill {
  skill: string;
  value: number;
}

export interface CreatePlayerPayload {
  name: string;
  gender: PlayerGender;
  nationality?: string;
  edition: {
    edition: number;
    fifaUpdate: number;
    age?: number;
    club?: string;
    position?: string;
    rating?: number;
    potential?: number;
    valueEur?: string;
    wageEur?: string;
    skills: CreatePlayerSkill[];
  };
}

export interface UpdatePlayerPayload {
  name?: string;
  nationality?: string;
}

export type PlayerGender = 'male' | 'female';

@Injectable({
  providedIn: 'root',
})
export class Players {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:3000/players';

  getPlayers(
    page = 1,
    limit = 30,
    gender?: PlayerGender,
    edition?: number,
    name?: string,
    club?: string,
    position?: string,
  ): Observable<PlayersResponse> {
    let params = new HttpParams()
      .set('page', page)
      .set('limit', limit);

    if (gender) {
      params = params.set('gender', gender);
    }

    if (edition !== undefined) {
      params = params.set('edition', edition);
    }

    if (name?.trim()) {
      params = params.set('name', name.trim());
    }

    if (club?.trim()) {
      params = params.set('club', club.trim());
    }

    if (position?.trim()) {
      params = params.set('position', position.trim());
    }

    return this.http.get<PlayersResponse>(this.apiUrl, { params });
  }

  getPlayersForExport(
    gender: PlayerGender,
    edition?: number,
    name?: string,
    club?: string,
    position?: string,
  ): Observable<PlayersResponse> {
    let params = new HttpParams()
      .set('gender', gender)
      .set('exportAll', 'true');

    if (edition !== undefined) {
      params = params.set('edition', edition);
    }

    if (name?.trim()) {
      params = params.set('name', name.trim());
    }

    if (club?.trim()) {
      params = params.set('club', club.trim());
    }

    if (position?.trim()) {
      params = params.set('position', position.trim());
    }

    return this.http.get<PlayersResponse>(this.apiUrl, { params });
  }

  getPlayerById(id: number): Observable<PlayerDetail> {
    return this.http.get<PlayerDetail>(`${this.apiUrl}/${id}`);
  }

  createPlayer(payload: CreatePlayerPayload): Observable<PlayerDetail> {
    return this.http.post<PlayerDetail>(this.apiUrl, payload);
  }

  updatePlayer(
    id: number,
    payload: UpdatePlayerPayload,
  ): Observable<PlayerDetail> {
    return this.http.patch<PlayerDetail>(`${this.apiUrl}/${id}`, payload);
  }
}










