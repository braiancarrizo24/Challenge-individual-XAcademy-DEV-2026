
import { Routes } from '@angular/router';

import { Home } from './pages/home/home';
import { PlayersList } from './pages/players-list/players-list';
import { WomenPlayersList } from './pages/women-players-list/women-players-list';
import { Comparisons } from './pages/comparisons/comparisons';
import { Teams } from './pages/teams/teams';
import { Leagues } from './pages/leagues/leagues';
import { Nationalities } from './pages/nationalities/nationalities';
import { YoungTalents } from './pages/young-talents/young-talents';
import { PlayerDetailComponent } from './pages/player-detail/player-detail';
import { PlayerForm } from './pages/player-form/player-form';

export const routes: Routes = [
  {
    path: '',
    component: Home,
    pathMatch: 'full',
  },
  {
    path: 'players',
    component: PlayersList,
  },
  {
    path: 'players/new',
    component: PlayerForm,
  },
  {
    path: 'players/:id',
    component: PlayerDetailComponent,
  },
  {
    path: 'players-women',
    component: WomenPlayersList,
  },
  {
    path: 'comparisons',
    component: Comparisons,
  },
  {
    path: 'teams',
    component: Teams,
  },
  {
    path: 'leagues',
    component: Leagues,
  },
  {
    path: 'nationalities',
    component: Nationalities,
  },
  {
    path: 'young-talents',
    component: YoungTalents,
  },
  {
    path: '**',
    redirectTo: '',
  },
];



