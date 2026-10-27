import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { EditionSelector } from './core/components/edition-selector/edition-selector';

@Component({
  imports: [RouterOutlet, EditionSelector],
  selector: 'app-root',
  styleUrl: './app.css',
  templateUrl: './app.html',
})
export class App {
  protected readonly title = signal('frontend');
}
