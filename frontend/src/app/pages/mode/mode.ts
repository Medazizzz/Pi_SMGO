import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-mode',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './mode.html',
  styleUrl: './mode.css'
})
export class ModeComponent {}