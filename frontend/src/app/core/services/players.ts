
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Player {
  id: number;
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

export type PlayerGender = 'male' | 'female';

@Injectable({
  providedIn: 'root',
})
export class Players {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:3000/players';

  getPlayers(
    page = 1,
    limit = 25,
    gender?: PlayerGender,
  ): Observable<PlayersResponse> {
    let params = new HttpParams()
      .set('page', page)
      .set('limit', limit);

    if (gender) {
      params = params.set('gender', gender);
    }

    return this.http.get<PlayersResponse>(this.apiUrl, { params });
  }
}



