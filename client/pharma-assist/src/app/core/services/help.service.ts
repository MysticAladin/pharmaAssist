import { Injectable, inject, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { DOCUMENT } from '@angular/common';
import {
  GuidedTour,
  TourStep,
  HelpTip,
  ALL_TOURS,
  CONTEXTUAL_TIPS
} from '../models/help.model';

@Injectable({
  providedIn: 'root'
})
export class HelpService {
  private readonly router = inject(Router);
  private readonly document = inject(DOCUMENT);

  private readonly COMPLETED_TOURS_KEY = 'pharma_completed_tours';
  private readonly DISMISSED_TIPS_KEY = 'pharma_dismissed_tips';

  // Tour state
  readonly isTourActive = signal(false);
  readonly currentTour = signal<GuidedTour | null>(null);
  readonly currentStepIndex = signal(0);

  readonly currentStep = computed(() => {
    const tour = this.currentTour();
    const index = this.currentStepIndex();
    return tour?.steps[index] || null;
  });

  readonly totalSteps = computed(() => this.currentTour()?.steps.length || 0);
  readonly isFirstStep = computed(() => this.currentStepIndex() === 0);
  readonly isLastStep = computed(() => this.currentStepIndex() === this.totalSteps() - 1);

  // Completed tours
  readonly completedTours = signal<Set<string>>(this.loadCompletedTours());

  // Dismissed tips
  readonly dismissedTips = signal<Set<string>>(this.loadDismissedTips());

  // All available tours
  readonly availableTours = ALL_TOURS;

  // Help panel visibility
  readonly isHelpPanelOpen = signal(false);

  // Start a guided tour
  startTour(tourId: string): void {
    const tour = ALL_TOURS.find(t => t.id === tourId);
    if (!tour) return;

    // Navigate to required route if specified
    if (tour.requiredRoute && !this.router.url.startsWith(tour.requiredRoute)) {
      this.router.navigate([tour.requiredRoute]).then(() => {
        setTimeout(() => this.initializeTour(tour), 500);
      });
    } else {
      this.initializeTour(tour);
    }
  }

  private initializeTour(tour: GuidedTour): void {
    this.currentTour.set(tour);
    this.currentStepIndex.set(0);
    this.isTourActive.set(true);
    this.highlightCurrentStep();
  }

  nextStep(): void {
    if (!this.isLastStep()) {
      this.currentStepIndex.update(i => i + 1);
      this.highlightCurrentStep();
    } else {
      this.completeTour();
    }
  }

  previousStep(): void {
    if (!this.isFirstStep()) {
      this.currentStepIndex.update(i => i - 1);
      this.highlightCurrentStep();
    }
  }

  skipTour(): void {
    this.clearHighlight();
    this.isTourActive.set(false);
    this.currentTour.set(null);
    this.currentStepIndex.set(0);
  }

  private completeTour(): void {
    const tour = this.currentTour();
    if (tour) {
      this.completedTours.update(set => {
        const newSet = new Set(set);
        newSet.add(tour.id);
        this.saveCompletedTours(newSet);
        return newSet;
      });
    }
    this.skipTour();
  }

  private highlightCurrentStep(): void {
    this.clearHighlight();

    const step = this.currentStep();
    if (!step) return;

    const target = this.document.querySelector(step.targetSelector);
    if (target) {
      target.classList.add('tour-highlight');
      target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  private clearHighlight(): void {
    const highlighted = this.document.querySelectorAll('.tour-highlight');
    highlighted.forEach(el => el.classList.remove('tour-highlight'));
  }

  // Tooltip methods
  getTip(tipId: string): HelpTip | undefined {
    return CONTEXTUAL_TIPS[tipId];
  }

  dismissTip(tipId: string): void {
    this.dismissedTips.update(set => {
      const newSet = new Set(set);
      newSet.add(tipId);
      this.saveDismissedTips(newSet);
      return newSet;
    });
  }

  isTipDismissed(tipId: string): boolean {
    return this.dismissedTips().has(tipId);
  }

  // Help panel
  openHelpPanel(): void {
    this.isHelpPanelOpen.set(true);
  }

  closeHelpPanel(): void {
    this.isHelpPanelOpen.set(false);
  }

  toggleHelpPanel(): void {
    this.isHelpPanelOpen.update(v => !v);
  }

  // Reset tours/tips for demo
  resetAllTours(): void {
    this.completedTours.set(new Set());
    localStorage.removeItem(this.COMPLETED_TOURS_KEY);
  }

  resetAllTips(): void {
    this.dismissedTips.set(new Set());
    localStorage.removeItem(this.DISMISSED_TIPS_KEY);
  }

  // Persistence
  private loadCompletedTours(): Set<string> {
    try {
      const stored = localStorage.getItem(this.COMPLETED_TOURS_KEY);
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch {
      return new Set();
    }
  }

  private saveCompletedTours(tours: Set<string>): void {
    try {
      localStorage.setItem(this.COMPLETED_TOURS_KEY, JSON.stringify([...tours]));
    } catch {
      // Ignore storage errors
    }
  }

  private loadDismissedTips(): Set<string> {
    try {
      const stored = localStorage.getItem(this.DISMISSED_TIPS_KEY);
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch {
      return new Set();
    }
  }

  private saveDismissedTips(tips: Set<string>): void {
    try {
      localStorage.setItem(this.DISMISSED_TIPS_KEY, JSON.stringify([...tips]));
    } catch {
      // Ignore storage errors
    }
  }
}
