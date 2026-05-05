import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../services/auth.service';
import { Abonnement } from '../../models/abonnement.model';

@Component({
  selector: 'app-payment',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './payment.html',
  styleUrls: ['./payment.css']
})
export class PaymentComponent implements OnInit {

  abonnement:  Abonnement | null = null;
  loading      = false;
  success      = false;
  error        = '';

  cardHolder   = '';
  cardNumber   = '';
  expiryDate   = '';
  cvv          = '';

  // Résultats validation
  trustScore   = 0;
  cardType     = '';
  maskedCard   = '';
  checks:  any = null;

  // 🆕 Remise fidélité
  discountApplied = false;
  originalPrice   = 0;
  discountAmount  = 0;
  finalPrice      = 0;

  constructor(
    private router:      Router,
    private http:        HttpClient,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    const stored = localStorage.getItem('selectedAbonnement');
    if (stored) {
      this.abonnement = JSON.parse(stored);
    } else {
      this.router.navigate(['/user/abonnements']);
    }

    // 🆕 Lire remise fidélité depuis localStorage
    this.discountApplied = localStorage.getItem('discountApplied') === 'true';
    if (this.discountApplied) {
      this.originalPrice  = parseFloat(localStorage.getItem('originalPrice')  || '0');
      this.discountAmount = parseFloat(localStorage.getItem('discountAmount') || '0');
      this.finalPrice     = parseFloat(localStorage.getItem('discountedPrice')|| '0');
    } else {
      // Pas de remise → prix normal de l'abonnement
      this.finalPrice = this.abonnement?.prix ?? 0;
    }
  }

  formatCardNumber(): void {
    let digits      = this.cardNumber.replace(/\D/g, '').substring(0, 16);
    this.cardNumber = digits.replace(/(\d{4})(?=\d)/g, '$1 ');
    this.checks     = null;
    this.error      = '';
    this.detectCardTypeRealtime(digits);
  }

  detectCardTypeRealtime(digits: string): void {
    if (digits.startsWith('4'))        this.cardType = 'VISA';
    else if (/^5[1-5]/.test(digits))  this.cardType = 'MASTERCARD';
    else if (/^2[2-7]/.test(digits))  this.cardType = 'MASTERCARD';
    else if (/^3[47]/.test(digits))   this.cardType = 'AMEX';
    else if (/^6(011|5)/.test(digits))this.cardType = 'DISCOVER';
    else                              this.cardType = '';
  }

  formatExpiryDate(): void {
    let val = this.expiryDate.replace(/\D/g, '').substring(0, 4);
    if (val.length >= 2) {
      this.expiryDate = val.substring(0, 2) + '/' + val.substring(2);
    } else {
      this.expiryDate = val;
    }
  }

  isFormValid(): boolean {
    const digits = this.cardNumber.replace(/\s/g, '');
    return this.cardHolder.trim().length > 2 &&
           digits.length === 16              &&
           this.expiryDate.length === 5      &&
           this.cvv.length >= 3;
  }

  getTrustColor(): string {
    if (this.trustScore >= 80) return 'text-green-400';
    if (this.trustScore >= 50) return 'text-yellow-400';
    return 'text-red-400';
  }

  getTrustBarColor(): string {
    if (this.trustScore >= 80) return 'bg-green-500';
    if (this.trustScore >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  }

  getCardIcon(): string {
    switch (this.cardType) {
      case 'VISA':       return '💳 VISA';
      case 'MASTERCARD': return '💳 MASTERCARD';
      case 'AMEX':       return '💳 AMEX';
      case 'DISCOVER':   return '💳 DISCOVER';
      default:           return '';
    }
  }

  // 🆕 Nettoyer localStorage après paiement réussi
  private clearDiscountStorage(): void {
    localStorage.removeItem('discountApplied');
    localStorage.removeItem('originalPrice');
    localStorage.removeItem('discountAmount');
    localStorage.removeItem('discountedPrice');
  }

  processPayment(): void {
    if (!this.isFormValid() || !this.abonnement) return;

    this.loading = true;
    this.error   = '';
    this.checks  = null;

    const userId = this.authService.getCurrentUserId();

    // 🆕 Utiliser finalPrice (réduit ou normal) comme montant envoyé au backend
    this.http.post<any>('http://localhost:8090/api/payments/process', {
      userId:         userId,
      abonnementId:   this.abonnement.id,
      abonnementType: this.abonnement.type,
      amount:         this.finalPrice,
      cardNumber:     this.cardNumber.replace(/\s/g, ''),
      cardHolder:     this.cardHolder,
      expiryDate:     this.expiryDate,
      cvv:            this.cvv
    }).subscribe({
      next: (response) => {
        this.loading    = false;
        this.trustScore = response.trustScore || 100;
        this.cardType   = response.cardType   || this.cardType;
        this.maskedCard = response.maskedCard || '';

        if (response.success) {
          this.success = true;
          localStorage.removeItem('selectedAbonnement');
          this.clearDiscountStorage(); // 🆕 Nettoyage remise
          setTimeout(() => {
            this.router.navigate(['/user/fidelities']);
          }, 3000);
        }
      },
      error: (err) => {
        this.loading = false;
        const body   = err.error;
        if (body) {
          this.trustScore = body.trustScore || 0;
          this.cardType   = body.cardType   || '';
          this.checks     = body.checks     || null;
          this.error      = body.message    || 'Payment declined';
        } else {
          this.error = 'Connection error — check Spring Boot';
        }
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/user/abonnements']);
  }
}