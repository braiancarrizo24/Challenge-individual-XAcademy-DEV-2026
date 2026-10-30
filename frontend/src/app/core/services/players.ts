
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Player {
  id: number;
  sourcePlayerId: number;
  name: string;
  nationality: string | null;
  gender: string;
}

export interface PlayersResponse {
  data: Player[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

@Injectable({
  providedIn: 'root',
})
export class Players {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:3000/players';

  getPlayers(page = 1, limit = 25): Observable<PlayersResponse> {
    const params = new HttpParams()
      .set('page', page)
      .set('limit', limit);

    return this.http.get<PlayersResponse>(this.apiUrl, { params });
  }
}

