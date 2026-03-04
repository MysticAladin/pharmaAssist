import { Component, OnInit, inject, signal, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { FullCalendarModule, FullCalendarComponent } from '@fullcalendar/angular';
import { CalendarOptions, EventInput, DateSelectArg, EventClickArg } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { forkJoin } from 'rxjs';

import { VisitService } from '../../core/services/visit.service';
import { VisitPlanService } from '../../core/services/visit-plan.service';
import { RepCustomerService } from '../../core/services/rep-customer.service';
import { VisitHistoryItem, PlannedVisit, VisitPlanDetail } from '../../core/models/visit.model';

@Component({
  selector: 'app-visit-calendar',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslateModule, FullCalendarModule],
  template: `
    <div class="calendar-page">
      <header class="header">
        <div class="header__left">
          <button class="btn btn-outline" (click)="goBack()">
            ← {{ 'common.back' | translate }}
          </button>
          <h1 class="header__title">{{ 'visits.calendar' | translate }}</h1>
        </div>
        <div class="header__legend">
          <span class="legend-item">
            <span class="legend-dot legend-dot--planned"></span>
            {{ 'visits.planned' | translate }}
          </span>
          <span class="legend-item">
            <span class="legend-dot legend-dot--completed"></span>
            {{ 'visits.completed' | translate }}
          </span>
          <span class="legend-item">
            <span class="legend-dot legend-dot--inprogress"></span>
            {{ 'visits.inProgress' | translate }}
          </span>
        </div>
      </header>

      @if (loading()) {
        <div class="loading">{{ 'common.loading' | translate }}</div>
      }

      <div class="calendar-wrapper" [class.hidden]="loading()">
        <full-calendar #calendar [options]="calendarOptions" />
      </div>

      <!-- Summary -->
      <div class="calendar-footer">
        <span class="footer-stat">
          📅 {{ plannedCount() }} {{ 'visits.planned' | translate }}
        </span>
        <span class="footer-stat footer-stat--completed">
          ✅ {{ completedCount() }} {{ 'visits.completed' | translate }}
        </span>
        <span class="footer-stat footer-stat--pending">
          🕐 {{ pendingCount() }} {{ 'visits.pending' | translate }}
        </span>
      </div>
    </div>
  `,
  styles: [`
    .calendar-page {
      display: flex;
      flex-direction: column;
      padding: 16px;
      gap: 12px;
      max-width: 1200px;
      margin: 0 auto;
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 12px;

      &__left {
        display: flex;
        align-items: center;
        gap: 16px;
      }

      &__title {
        font-size: 20px;
        font-weight: 700;
        margin: 0;
        color: var(--text-primary);
      }

      &__legend {
        display: flex;
        gap: 16px;
        flex-wrap: wrap;
      }
    }

    .legend-item {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 13px;
      color: var(--text-secondary);
    }

    .legend-dot {
      width: 12px;
      height: 12px;
      border-radius: 50%;

      &--planned { background: #3b82f6; }
      &--completed { background: #10b981; }
      &--inprogress { background: #f59e0b; }
    }

    .loading {
      text-align: center;
      padding: 40px;
      color: var(--text-secondary);
    }

    .calendar-wrapper {
      background: var(--bg-secondary);
      border: 1px solid var(--border-light);
      border-radius: 16px;
      padding: 16px;
      overflow: hidden;

      &.hidden {
        visibility: hidden;
        height: 0;
        padding: 0;
        overflow: hidden;
      }
    }

    .calendar-footer {
      display: flex;
      gap: 24px;
      flex-wrap: wrap;

      .footer-stat {
        font-size: 14px;
        font-weight: 500;
        color: var(--text-secondary);

        &--completed { color: #10b981; }
        &--pending { color: #f59e0b; }
      }
    }

    .btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 8px 16px;
      border-radius: 10px;
      font-size: 14px;
      font-weight: 600;
      border: none;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .btn-outline {
      background: transparent;
      border: 1px solid var(--border-light);
      color: var(--text-primary);
      &:hover { background: var(--bg-tertiary); }
    }

    /* FullCalendar overrides */
    :host ::ng-deep {
      .fc {
        font-family: inherit;
      }

      .fc .fc-toolbar-title {
        font-size: 18px;
        font-weight: 700;
        color: var(--text-primary);
      }

      .fc .fc-button {
        background: var(--bg-tertiary);
        border: 1px solid var(--border-light);
        color: var(--text-primary);
        font-weight: 600;
        font-size: 13px;
        border-radius: 8px;
        padding: 6px 12px;
        text-transform: capitalize;

        &:hover {
          background: var(--border-light);
        }

        &.fc-button-active {
          background: var(--primary);
          color: white;
          border-color: var(--primary);
        }
      }

      .fc .fc-daygrid-day {
        border-color: var(--border-light);
        cursor: pointer;

        &:hover {
          background: rgba(var(--primary-rgb, 59, 130, 246), 0.04);
        }
      }

      .fc .fc-daygrid-day-number {
        color: var(--text-primary);
        font-weight: 500;
        font-size: 13px;
      }

      .fc .fc-day-today {
        background: rgba(var(--primary-rgb, 59, 130, 246), 0.06) !important;
      }

      .fc .fc-col-header-cell-cushion {
        color: var(--text-secondary);
        font-weight: 600;
        font-size: 12px;
        text-transform: uppercase;
      }

      .fc .fc-event {
        border: none;
        border-radius: 6px;
        padding: 2px 6px;
        font-size: 12px;
        font-weight: 500;
        line-height: 1.5;
        margin-bottom: 2px;
        cursor: pointer;
      }

      .fc .fc-event.event-planned {
        background: #3b82f6;
        color: white;
      }

      .fc .fc-event.event-completed {
        background: #10b981;
        color: white;
      }

      .fc .fc-event.event-inprogress {
        background: #f59e0b;
        color: white;
      }

      .fc .fc-event.event-missed {
        background: #ef4444;
        color: white;
      }

      .fc .fc-more-link {
        color: var(--primary);
        font-weight: 600;
      }
    }
  `]
})
export class VisitCalendarComponent implements OnInit {
  @ViewChild('calendar') calendarComponent!: FullCalendarComponent;

  private readonly visitService = inject(VisitService);
  private readonly planService = inject(VisitPlanService);
  private readonly router = inject(Router);
  private readonly translate = inject(TranslateService);

  loading = signal(true);
  plannedCount = signal(0);
  completedCount = signal(0);
  pendingCount = signal(0);

  calendarOptions: CalendarOptions = {
    plugins: [dayGridPlugin, interactionPlugin],
    initialView: 'dayGridMonth',
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: 'dayGridMonth,dayGridWeek'
    },
    editable: false,
    selectable: true,
    dayMaxEvents: 4,
    weekends: true,
    firstDay: 1, // Monday
    height: 'auto',
    events: [],
    eventClick: this.handleEventClick.bind(this),
    dateClick: this.handleDateClick.bind(this),
    locale: 'bs'
  };

  ngOnInit(): void {
    this.loadCalendarData();
  }

  goBack(): void {
    this.router.navigate(['/visits']);
  }

  private loadCalendarData(): void {
    this.loading.set(true);

    // Load planned visits and visit history in parallel
    const now = new Date();
    const threeMonthsAgo = new Date(now);
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 2);
    const oneMonthAhead = new Date(now);
    oneMonthAhead.setMonth(oneMonthAhead.getMonth() + 1);

    forkJoin({
      history: this.visitService.getHistory({
        fromDate: threeMonthsAgo.toISOString().split('T')[0],
        toDate: oneMonthAhead.toISOString().split('T')[0],
        page: 1,
        pageSize: 500
      }),
      plans: this.planService.getPlans(threeMonthsAgo)
    }).subscribe({
      next: ({ history, plans }) => {
        const events: EventInput[] = [];
        let planned = 0;
        let completed = 0;
        let pending = 0;

        // Map executed visits to calendar events
        for (const visit of history.items) {
          const isCompleted = visit.isCompleted;
          events.push({
            id: `visit-${visit.id}`,
            title: `${visit.customerName}`,
            start: visit.checkInTime,
            end: visit.checkOutTime || undefined,
            classNames: [isCompleted ? 'event-completed' : 'event-inprogress'],
            extendedProps: {
              type: 'executed',
              visitId: visit.id,
              customerId: visit.customerId,
              customerName: visit.customerName
            }
          });
          if (isCompleted) completed++;
          else pending++;
        }

        // Load planned visits from each plan
        const planDetailRequests = plans.map(p => this.planService.getPlan(p.id));

        if (planDetailRequests.length > 0) {
          forkJoin(planDetailRequests).subscribe({
            next: (planDetails: VisitPlanDetail[]) => {
              for (const plan of planDetails) {
                for (const pv of plan.plannedVisits) {
                  // Skip if already executed
                  if (pv.hasExecutedVisit) continue;

                  const eventDate = pv.plannedDate;
                  const isPast = new Date(eventDate) < now;

                  events.push({
                    id: `planned-${pv.id}`,
                    title: `📋 ${pv.customerName}`,
                    start: pv.plannedTime ? `${eventDate}T${pv.plannedTime}` : eventDate,
                    classNames: [isPast ? 'event-missed' : 'event-planned'],
                    extendedProps: {
                      type: 'planned',
                      plannedVisitId: pv.id,
                      planId: pv.planId,
                      customerId: pv.customerId,
                      customerName: pv.customerName,
                      objective: pv.visitObjective
                    }
                  });
                  planned++;
                }
              }

              this.updateCalendar(events, planned, completed, pending);
            },
            error: () => {
              this.updateCalendar(events, planned, completed, pending);
            }
          });
        } else {
          this.updateCalendar(events, planned, completed, pending);
        }
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }

  private updateCalendar(events: EventInput[], planned: number, completed: number, pending: number): void {
    this.plannedCount.set(planned);
    this.completedCount.set(completed);
    this.pendingCount.set(pending);

    this.calendarOptions = {
      ...this.calendarOptions,
      events
    };
    this.loading.set(false);
  }

  handleEventClick(clickInfo: EventClickArg): void {
    const props = clickInfo.event.extendedProps;

    if (props['type'] === 'executed') {
      this.router.navigate(['/visits', props['visitId']]);
    } else if (props['type'] === 'planned') {
      // Navigate to the customer detail or planner
      this.router.navigate(['/visits/planner']);
    }
  }

  handleDateClick(info: any): void {
    // Navigate to planner for that date to add new visits
    this.router.navigate(['/visits/planner'], {
      queryParams: { date: info.dateStr }
    });
  }
}
