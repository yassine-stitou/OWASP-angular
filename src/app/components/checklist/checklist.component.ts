import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Category, Section } from '../../models/asvs.model';
import { AsvsService } from '../../services/asvs.service';

@Component({
  selector: 'app-checklist',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './checklist.component.html',
  styleUrls: ['./checklist.component.scss']
})
export class ChecklistComponent {
  @Input() categories: Category[] = [];
  @Input() activeLevels: number[] = [1, 2, 3];
  @Input() scoreByCategory: { [key: string]: { total: number; checked: number } } = {};

  expandedCategories = new Set<string>();
  expandedSections = new Set<string>();

  constructor(private asvsService: AsvsService) {}

  toggleCategory(catId: string): void {
    if (this.expandedCategories.has(catId)) {
      this.expandedCategories.delete(catId);
    } else {
      this.expandedCategories.add(catId);
    }
  }

  toggleSection(secId: string): void {
    if (this.expandedSections.has(secId)) {
      this.expandedSections.delete(secId);
    } else {
      this.expandedSections.add(secId);
    }
  }

  isCategoryExpanded(catId: string): boolean {
    return this.expandedCategories.has(catId);
  }

  isSectionExpanded(secId: string): boolean {
    return this.expandedSections.has(secId);
  }

  onRequirementToggle(reqId: string, checked: boolean): void {
    this.asvsService.toggleRequirement(reqId, checked);
  }

  toggleAllInCategory(catId: string, checked: boolean): void {
    this.asvsService.toggleAllInCategory(catId, checked, this.activeLevels);
  }

  isReqVisible(levels: number[]): boolean {
    return levels.some(l => this.activeLevels.includes(l));
  }

  getLevelBadge(level: number): string {
    return `L${level}`;
  }

  getCategoryProgress(catId: string): number {
    const cat = this.scoreByCategory[catId];
    if (!cat || cat.total === 0) return 0;
    return Math.round((cat.checked / cat.total) * 100);
  }

  getCategoryScore(catId: string): { checked: number; total: number } {
    return this.scoreByCategory[catId] || { checked: 0, total: 0 };
  }

  getVisibleRequirementsCount(section: Section): number {
    return section.requirements.filter(r => this.isReqVisible(r.level)).length;
  }

  getCheckedInSection(section: Section): number {
    return section.requirements.filter(r => this.isReqVisible(r.level) && r.checked).length;
  }

  getCategoryIcon(catId: string): string {
    const icons: Record<string, string> = {
      V1: '🏗️', V2: '🔐', V3: '🎟️', V4: '🚪', V5: '🧹',
      V6: '🔒', V7: '📋', V8: '🗄️', V9: '🌐', V10: '🦠',
      V11: '⚙️', V12: '📁', V13: '🔌', V14: '⚙️'
    };
    return icons[catId] || '📌';
  }
}
