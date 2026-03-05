import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { DepartmentService } from '../../../core/services/department.service';
import { PhysicianService } from '../../../core/services/physician.service';
import {
  Department,
  DepartmentDetail,
  Physician,
  PhysicianSpecialty,
  KOLStatus,
  SPECIALTY_LABELS,
  KOL_STATUS_LABELS
} from '../../../core/models/hospital.model';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { CustomerService } from '../../../core/services/customer.service';

interface HierarchyNode {
  type: 'institution' | 'department' | 'physician';
  id: number;
  name: string;
  subtitle?: string;
  badge?: string;
  badgeVariant?: 'success' | 'warning' | 'info' | 'neutral' | 'primary';
  children: HierarchyNode[];
  expanded: boolean;
  meta?: Record<string, string>;
}

@Component({
  selector: 'app-hierarchy-view',
  standalone: true,
  imports: [CommonModule, RouterLink, TranslateModule, StatusBadgeComponent],
  templateUrl: './hierarchy-view.component.html'
})
export class HierarchyViewComponent implements OnInit {
  private readonly departmentService = inject(DepartmentService);
  private readonly physicianService = inject(PhysicianService);
  private readonly customerService = inject(CustomerService);
  private readonly route = inject(ActivatedRoute);
  private readonly translate = inject(TranslateService);

  customerId = signal<number>(0);
  loading = signal(true);
  rootNode = signal<HierarchyNode | null>(null);

  totalDepartments = computed(() => {
    const root = this.rootNode();
    return root ? root.children.length : 0;
  });

  totalPhysicians = computed(() => {
    const root = this.rootNode();
    if (!root) return 0;
    let count = 0;
    for (const dept of root.children) {
      count += dept.children.length;
    }
    // Also count unassigned physicians
    return count;
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('customerId');
    if (id) {
      this.customerId.set(+id);
      this.buildHierarchy(+id);
    }
  }

  buildHierarchy(customerId: number): void {
    this.loading.set(true);

    // Load customer, departments, and physicians in parallel
    let customerName = '';
    let departments: Department[] = [];
    let allPhysicians: Physician[] = [];
    let loaded = 0;
    const checkDone = (): void => {
      loaded++;
      if (loaded < 3) return;

      // Build hierarchy tree
      const deptNodes: HierarchyNode[] = departments.map(dept => {
        const deptPhysicians = allPhysicians.filter(p => p.departmentId === dept.id);
        return {
          type: 'department' as const,
          id: dept.id,
          name: dept.name,
          subtitle: dept.floor ? `Floor: ${dept.floor}` : undefined,
          badge: `${deptPhysicians.length}`,
          badgeVariant: 'info' as const,
          expanded: true,
          children: deptPhysicians.map(p => this.physicianToNode(p)),
          meta: {
            ...(dept.headPhysicianName ? { head: dept.headPhysicianName } : {}),
            ...(dept.contactPhone ? { phone: dept.contactPhone } : {})
          }
        };
      });

      // Unassigned physicians (no department)
      const unassigned = allPhysicians.filter(p => !p.departmentId);
      if (unassigned.length > 0) {
        deptNodes.push({
          type: 'department',
          id: 0,
          name: this.translate.instant('HOSPITAL.UNASSIGNED'),
          subtitle: this.translate.instant('HOSPITAL.NO_DEPARTMENT_ASSIGNED'),
          badge: `${unassigned.length}`,
          badgeVariant: 'warning',
          expanded: true,
          children: unassigned.map(p => this.physicianToNode(p))
        });
      }

      this.rootNode.set({
        type: 'institution',
        id: customerId,
        name: customerName || `Institution #${customerId}`,
        badge: `${departments.length} depts`,
        badgeVariant: 'primary',
        expanded: true,
        children: deptNodes
      });

      this.loading.set(false);
    };

    this.customerService.getById(customerId).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          customerName = res.data.name;
        }
        checkDone();
      },
      error: () => checkDone()
    });

    this.departmentService.getByCustomer(customerId).subscribe({
      next: (res) => {
        if (res.succeeded) departments = res.data;
        checkDone();
      },
      error: () => checkDone()
    });

    this.physicianService.getByInstitution(customerId).subscribe({
      next: (res) => {
        if (res.succeeded) allPhysicians = res.data;
        checkDone();
      },
      error: () => checkDone()
    });
  }

  private physicianToNode(p: Physician): HierarchyNode {
    const specialtyKey = SPECIALTY_LABELS[p.specialty] || 'HOSPITAL.SPECIALTY.OTHER';
    return {
      type: 'physician',
      id: p.id,
      name: p.fullName,
      subtitle: this.translate.instant(specialtyKey),
      badge: this.getKolLabel(p.kolStatus),
      badgeVariant: this.getKolBadgeVariant(p.kolStatus),
      expanded: false,
      children: [],
      meta: {
        ...(p.licenseNumber ? { license: p.licenseNumber } : {}),
        ...(p.phone ? { phone: p.phone } : {}),
        ...(p.email ? { email: p.email } : {}),
        prescriptions: `${p.prescriptionCount}`
      }
    };
  }

  getKolLabel(status: KOLStatus): string {
    return this.translate.instant(KOL_STATUS_LABELS[status] || 'HOSPITAL.KOL.NONE');
  }

  getKolBadgeVariant(status: KOLStatus): 'success' | 'warning' | 'info' | 'neutral' {
    switch (status) {
      case KOLStatus.Senior: return 'success';
      case KOLStatus.Active: return 'info';
      case KOLStatus.Potential: return 'warning';
      default: return 'neutral';
    }
  }

  toggleNode(node: HierarchyNode): void {
    node.expanded = !node.expanded;
  }

  getNodeIcon(node: HierarchyNode): string {
    switch (node.type) {
      case 'institution': return 'icon-home';
      case 'department': return 'icon-grid';
      case 'physician': return 'icon-user';
    }
  }
}
