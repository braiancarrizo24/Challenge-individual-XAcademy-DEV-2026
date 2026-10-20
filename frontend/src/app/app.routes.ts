
import { Routes } from '@angular/router';
import { PlayersList } from './pages/players-list/players-list';
import { WomenPlayersList } from './pages/women-players-list/women-players-list';
import { Home } from './pages/home/home';

export const routes: Routes = [
  {
    path: 'players',
    component: PlayersList,
  },
  {
    path: 'players-women',
    component: WomenPlayersList,
  },
  {
    path: '',
    component: Home,
    pathMatch: 'full',
  },
  {
    path: '**',
    redirectTo: '',
  },
];
