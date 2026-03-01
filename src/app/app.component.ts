import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { AsvsService } from './services/asvs.service';
import { Category, ComplianceScore } from './models/asvs.model';
import { HeaderComponent } from './components/header/header.component';
import { ScoreCardComponent } from './components/score-card/score-card.component';
import { ChecklistComponent } from './components/checklist/checklist.component';
import { RecommendationsComponent } from './components/recommendations/recommendations.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    HttpClientModule,
    HeaderComponent,
    ScoreCardComponent,
    ChecklistComponent,
    RecommendationsComponent
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  categories: Category[] = [];
  score: ComplianceScore = {
    total: 0,
    checked: 0,
    percentage: 0,
    byCategory: {},
    byLevel: {
      L1: { total: 0, checked: 0 },
      L2: { total: 0, checked: 0 },
      L3: { total: 0, checked: 0 }
    }
  };
  activeTab: 'checklist' | 'recommendations' = 'checklist';
  activeLevels: number[] = [1, 2, 3];
  searchQuery = '';
  filteredCategories: Category[] = [];
  savedToast = false;

  constructor(private asvsService: AsvsService) {}

  ngOnInit(): void {
    this.asvsService.categories$.subscribe(cats => {
      this.categories = cats;
      this.applyFilter();
      this.updateScore();
    });
    setTimeout(() => this.asvsService.loadProgress(), 500);
  }

  updateScore(): void {
    this.score = this.asvsService.getComplianceScore(this.activeLevels);
  }

  applyFilter(): void {
    const q = this.searchQuery.toLowerCase().trim();
    if (!q) {
      this.filteredCategories = this.categories;
      return;
    }
    this.filteredCategories = this.categories.map(cat => ({
      ...cat,
      sections: cat.sections.map(sec => ({
        ...sec,
        requirements: sec.requirements.filter(req =>
          req.description.toLowerCase().includes(q) ||
          req.id.toLowerCase().includes(q) ||
          (req.cwe && String(req.cwe).includes(q))
        )
      })).filter(sec => sec.requirements.length > 0)
    })).filter(cat => cat.sections.length > 0);
  }

  onLevelToggle(level: number): void {
    if (this.activeLevels.includes(level)) {
      if (this.activeLevels.length > 1) {
        this.activeLevels = this.activeLevels.filter(l => l !== level);
      }
    } else {
      this.activeLevels = [...this.activeLevels, level].sort();
    }
    this.updateScore();
  }

  onSearchChange(): void {
    this.applyFilter();
  }

  onSelectAll(): void {
    this.asvsService.toggleAll(true, this.activeLevels);
  }

  onDeselectAll(): void {
    this.asvsService.toggleAll(false, this.activeLevels);
  }

  onSave(): void {
    this.asvsService.saveProgress();
    this.savedToast = true;
    setTimeout(() => this.savedToast = false, 2500);
  }

  onReset(): void {
    if (confirm('Reset all progress? This cannot be undone.')) {
      this.asvsService.resetProgress();
    }
  }

  get missingCount(): number {
    return this.score ? this.score.total - this.score.checked : 0;
  }
}
