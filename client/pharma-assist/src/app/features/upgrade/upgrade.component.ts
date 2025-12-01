import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { FeatureFlagService } from '../../core/state/feature-flag.service';
import { FeatureKey, FeatureTier, FEATURE_METADATA } from '../../core/models/feature-flag.model';

@Component({
  selector: 'app-upgrade',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="upgrade-page">
      <div class="upgrade-header">
        <h1>Nadogradite svoj plan</h1>
        <p>Otključajte napredne funkcije i unaprijedite svoje poslovanje</p>
      </div>

      <div class="plans-grid">
        <!-- Basic Plan -->
        <div class="plan-card" [class.current]="currentTier === 'basic'">
          @if (currentTier === 'basic') {
            <div class="current-badge">Trenutni plan</div>
          }
          <div class="plan-header">
            <h3 class="plan-name">Basic</h3>
            <div class="plan-price">
              <span class="price">99</span>
              <span class="currency">KM/mj</span>
            </div>
          </div>
          <ul class="plan-features">
            <li><i class="icon-check"></i> Upravljanje inventarom</li>
            <li><i class="icon-check"></i> Upravljanje kupcima</li>
            <li><i class="icon-check"></i> Osnovni izvještaji</li>
            <li><i class="icon-check"></i> Email podrška</li>
          </ul>
          <button class="btn btn-outline" [disabled]="currentTier === 'basic'">
            {{ currentTier === 'basic' ? 'Trenutni plan' : 'Izaberi' }}
          </button>
        </div>

        <!-- Professional Plan -->
        <div class="plan-card featured" [class.current]="currentTier === 'professional'">
          <div class="popular-badge">Najpopularniji</div>
          @if (currentTier === 'professional') {
            <div class="current-badge">Trenutni plan</div>
          }
          <div class="plan-header">
            <h3 class="plan-name">Professional</h3>
            <div class="plan-price">
              <span class="price">249</span>
              <span class="currency">KM/mj</span>
            </div>
          </div>
          <ul class="plan-features">
            <li><i class="icon-check"></i> Sve iz Basic plana</li>
            <li><i class="icon-check"></i> Napredni dashboard</li>
            <li><i class="icon-check"></i> Upravljanje receptima</li>
            <li><i class="icon-check"></i> Napredni izvještaji</li>
            <li><i class="icon-check"></i> Export u PDF/CSV</li>
            <li><i class="icon-check"></i> Upozorenja o zalihama</li>
            <li><i class="icon-check"></i> Prioritetna podrška</li>
          </ul>
          <button class="btn btn-primary" [disabled]="currentTier === 'professional'">
            {{ currentTier === 'professional' ? 'Trenutni plan' : 'Nadogradi' }}
          </button>
        </div>

        <!-- Enterprise Plan -->
        <div class="plan-card" [class.current]="currentTier === 'enterprise'">
          @if (currentTier === 'enterprise') {
            <div class="current-badge">Trenutni plan</div>
          }
          <div class="plan-header">
            <h3 class="plan-name">Enterprise</h3>
            <div class="plan-price">
              <span class="price">Po dogovoru</span>
            </div>
          </div>
          <ul class="plan-features">
            <li><i class="icon-check"></i> Sve iz Professional plana</li>
            <li><i class="icon-check"></i> Multi-warehouse</li>
            <li><i class="icon-check"></i> AI analitika</li>
            <li><i class="icon-check"></i> API pristup</li>
            <li><i class="icon-check"></i> SSO integracija</li>
            <li><i class="icon-check"></i> Revizijski dnevnik</li>
            <li><i class="icon-check"></i> Posvećeni account manager</li>
          </ul>
          <button class="btn btn-outline">Kontaktirajte nas</button>
        </div>
      </div>

      <div class="back-link">
        <a routerLink="/dashboard">← Nazad na kontrolnu ploču</a>
      </div>
    </div>
  `,
  styles: [`
    .upgrade-page {
      max-width: 1200px;
      margin: 0 auto;
      padding: 40px 20px;
    }

    .upgrade-header {
      text-align: center;
      margin-bottom: 48px;
    }

    .upgrade-header h1 {
      font-size: 32px;
      font-weight: 700;
      margin-bottom: 12px;
    }

    .upgrade-header p {
      font-size: 16px;
      color: #64748b;
    }

    .plans-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 24px;
      margin-bottom: 40px;
    }

    .plan-card {
      position: relative;
      background: #fff;
      border-radius: 16px;
      padding: 32px;
      border: 2px solid #e2e8f0;
      transition: all 0.3s ease;
    }

    .plan-card:hover {
      border-color: #3b82f6;
      transform: translateY(-4px);
    }

    .plan-card.featured {
      border-color: #3b82f6;
      box-shadow: 0 10px 40px rgba(59, 130, 246, 0.15);
    }

    .plan-card.current {
      background: #f0f9ff;
    }

    .popular-badge {
      position: absolute;
      top: -12px;
      left: 50%;
      transform: translateX(-50%);
      background: #3b82f6;
      color: #fff;
      padding: 4px 16px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
    }

    .current-badge {
      position: absolute;
      top: 16px;
      right: 16px;
      background: #10b981;
      color: #fff;
      padding: 4px 12px;
      border-radius: 16px;
      font-size: 11px;
      font-weight: 600;
    }

    .plan-header {
      text-align: center;
      margin-bottom: 24px;
      padding-bottom: 24px;
      border-bottom: 1px solid #e2e8f0;
    }

    .plan-name {
      font-size: 20px;
      font-weight: 600;
      margin-bottom: 12px;
    }

    .plan-price .price {
      font-size: 40px;
      font-weight: 700;
      color: #1e293b;
    }

    .plan-price .currency {
      font-size: 14px;
      color: #64748b;
    }

    .plan-features {
      list-style: none;
      padding: 0;
      margin: 0 0 24px;
    }

    .plan-features li {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 8px 0;
      font-size: 14px;
    }

    .plan-features i {
      color: #10b981;
      font-size: 18px;
    }

    .btn {
      width: 100%;
      padding: 14px;
      border-radius: 10px;
      font-size: 15px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .btn-primary {
      background: #3b82f6;
      color: #fff;
      border: none;
    }

    .btn-primary:hover:not(:disabled) {
      background: #2563eb;
    }

    .btn-outline {
      background: transparent;
      border: 2px solid #3b82f6;
      color: #3b82f6;
    }

    .btn-outline:hover:not(:disabled) {
      background: #f0f9ff;
    }

    .btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .back-link {
      text-align: center;
    }

    .back-link a {
      color: #3b82f6;
      text-decoration: none;
    }

    @media (max-width: 1024px) {
      .plans-grid {
        grid-template-columns: 1fr;
        max-width: 400px;
        margin-left: auto;
        margin-right: auto;
      }
    }
  `]
})
export class UpgradeComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly featureFlags = inject(FeatureFlagService);

  currentTier = this.featureFlags.getTier();
}
