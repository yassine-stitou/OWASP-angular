import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, map } from 'rxjs';
import { Category, ComplianceScore, Requirement } from '../models/asvs.model';

@Injectable({ providedIn: 'root' })
export class AsvsService {
  private categoriesSubject = new BehaviorSubject<Category[]>([]);
  categories$ = this.categoriesSubject.asObservable();

  private selectedLevelSubject = new BehaviorSubject<number[]>([1, 2, 3]);
  selectedLevel$ = this.selectedLevelSubject.asObservable();

  constructor(private http: HttpClient) {
    this.loadData();
  }

  private loadData(): void {
    this.http.get<Category[]>('assets/asvs-data.json').subscribe(data => {
      const initialized = data.map(cat => ({
        ...cat,
        sections: cat.sections.map(sec => ({
          ...sec,
          requirements: sec.requirements.map(req => ({ ...req, checked: false }))
        }))
      }));
      this.categoriesSubject.next(initialized);
    });
  }

  toggleRequirement(reqId: string, checked: boolean): void {
    const cats = this.categoriesSubject.getValue().map(cat => ({
      ...cat,
      sections: cat.sections.map(sec => ({
        ...sec,
        requirements: sec.requirements.map(req =>
          req.id === reqId ? { ...req, checked } : req
        )
      }))
    }));
    this.categoriesSubject.next(cats);
  }

  toggleAllInCategory(catId: string, checked: boolean, levels: number[]): void {
    const cats = this.categoriesSubject.getValue().map(cat => ({
      ...cat,
      sections: cat.sections.map(sec => ({
        ...sec,
        requirements: sec.requirements.map(req => {
          if (cat.id === catId && req.level.some(l => levels.includes(l))) {
            return { ...req, checked };
          }
          return req;
        })
      }))
    }));
    this.categoriesSubject.next(cats);
  }

  toggleAll(checked: boolean, levels: number[]): void {
    const cats = this.categoriesSubject.getValue().map(cat => ({
      ...cat,
      sections: cat.sections.map(sec => ({
        ...sec,
        requirements: sec.requirements.map(req => {
          if (req.level.some(l => levels.includes(l))) {
            return { ...req, checked };
          }
          return req;
        })
      }))
    }));
    this.categoriesSubject.next(cats);
  }

  setLevelFilter(levels: number[]): void {
    this.selectedLevelSubject.next(levels);
  }

  getComplianceScore(levels: number[]): ComplianceScore {
    const cats = this.categoriesSubject.getValue();
    const score: ComplianceScore = {
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

    cats.forEach(cat => {
      score.byCategory[cat.id] = { total: 0, checked: 0 };
      cat.sections.forEach(sec => {
        sec.requirements.forEach(req => {
          const matchesFilter = req.level.some(l => levels.includes(l));
          if (!matchesFilter) return;

          score.total++;
          score.byCategory[cat.id].total++;
          if (req.level.includes(1) && levels.includes(1)) {
            score.byLevel.L1.total++;
            if (req.checked) score.byLevel.L1.checked++;
          }
          if (req.level.includes(2) && levels.includes(2)) {
            score.byLevel.L2.total++;
            if (req.checked) score.byLevel.L2.checked++;
          }
          if (req.level.includes(3) && levels.includes(3)) {
            score.byLevel.L3.total++;
            if (req.checked) score.byLevel.L3.checked++;
          }

          if (req.checked) {
            score.checked++;
            score.byCategory[cat.id].checked++;
          }
        });
      });
    });

    score.percentage = score.total > 0 ? Math.round((score.checked / score.total) * 100) : 0;
    return score;
  }

  getMissingRequirements(levels: number[]): Requirement[] {
    const cats = this.categoriesSubject.getValue();
    const missing: Requirement[] = [];
    cats.forEach(cat => {
      cat.sections.forEach(sec => {
        sec.requirements.forEach(req => {
          if (!req.checked && req.level.some(l => levels.includes(l))) {
            missing.push(req);
          }
        });
      });
    });
    return missing;
  }

  saveProgress(): void {
    const cats = this.categoriesSubject.getValue();
    const checkedIds = cats.flatMap(c =>
      c.sections.flatMap(s =>
        s.requirements.filter(r => r.checked).map(r => r.id)
      )
    );
    localStorage.setItem('asvs-checked', JSON.stringify(checkedIds));
  }

  loadProgress(): void {
    const saved = localStorage.getItem('asvs-checked');
    if (!saved) return;
    const checkedIds: string[] = JSON.parse(saved);
    const cats = this.categoriesSubject.getValue().map(cat => ({
      ...cat,
      sections: cat.sections.map(sec => ({
        ...sec,
        requirements: sec.requirements.map(req => ({
          ...req,
          checked: checkedIds.includes(req.id)
        }))
      }))
    }));
    this.categoriesSubject.next(cats);
  }

  resetProgress(): void {
    localStorage.removeItem('asvs-checked');
    this.loadData();
  }
}
