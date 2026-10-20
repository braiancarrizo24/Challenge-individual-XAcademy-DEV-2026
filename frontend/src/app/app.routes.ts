
import { Routes } from '@angular/router';
import { PlayersList } from './pages/players-list/players-list';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'players',
    pathMatch: 'full',
  },
  {
    path: 'players',
    component: PlayersList,
  },
  {
    path: '**',
    redirectTo: 'players',
  },
];
