
import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  imports: [RouterLink],
  selector: 'app-home',
  styleUrl: './home.css',
  templateUrl: './home.html',
})
export class Home implements OnInit {
  featuredPlayers = [
    {
      id: 1,
      name: 'Jugador de prueba 1',
      nationality: 'Argentina',
      position: 'ED',
      club: 'Club de prueba',
      edition: 2023,
      rating: 90,
    },
    {
      id: 2,
      name: 'Jugador de prueba 2',
      nationality: 'Francia',
      position: 'DC',
      club: 'Club de prueba',
      edition: 2023,
      rating: 88,
    },
  ];

  ngOnInit(): void {
    this.selectFeaturedPlayers();
  }

  selectFeaturedPlayers(): void {
    this.featuredPlayers = [...this.featuredPlayers].sort(
      () => Math.random() - 0.5
    );
  }
}

