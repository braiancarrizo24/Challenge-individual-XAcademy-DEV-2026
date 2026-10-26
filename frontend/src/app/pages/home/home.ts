
import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';

type Theme = 'light' | 'dark';
type Language = 'es' | 'en';

@Component({
  imports: [RouterLink],
  selector: 'app-home',
  styleUrl: './home.css',
  templateUrl: './home.html',
})
export class Home implements OnInit {
  isDarkMode = true;
  language: Language = 'es';

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
    this.loadPreferences();
    this.selectFeaturedPlayers();
    this.applyTheme();
  }

  selectFeaturedPlayers(): void {
    this.featuredPlayers = [...this.featuredPlayers].sort(
      () => Math.random() - 0.5
    );
  }

  toggleTheme(): void {
    this.isDarkMode = !this.isDarkMode;
    this.applyTheme();
    localStorage.setItem('fifa-stats-theme', this.isDarkMode ? 'dark' : 'light');
  }

  setTheme(dark: boolean): void {
    this.isDarkMode = dark;
    this.applyTheme();

    localStorage.setItem(
      'fifa-stats-theme',
      dark ? 'dark' : 'light'
    );
  }

  toggleLanguage(): void {
    this.language = this.language === 'es' ? 'en' : 'es';
    localStorage.setItem('fifa-stats-language', this.language);
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


