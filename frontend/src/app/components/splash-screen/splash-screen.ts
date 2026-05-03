import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
@Component({
  selector: 'app-splash',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './splash-screen.component.html',  // ✅
  styleUrls: ['./splash-screen.component.css']     // ✅
})
export class SplashComponent implements OnInit {
  letters = 'ShowMatchGoOn'.split('');

  constructor(private router: Router) {}

  ngOnInit(): void {
    setTimeout(() => {
      this.router.navigate(['/auth/login']);
    }, 4000);
  }
}