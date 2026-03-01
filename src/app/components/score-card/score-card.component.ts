import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ComplianceScore } from '../../models/asvs.model';

@Component({
  selector: 'app-score-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './score-card.component.html',
  styleUrls: ['./score-card.component.scss']
})
export class ScoreCardComponent {
  @Input() score!: ComplianceScore;

  getLevelPct(level: 'L1' | 'L2' | 'L3'): number {
    const l = this.score.byLevel[level];
    return l.total > 0 ? Math.round((l.checked / l.total) * 100) : 0;
  }
}
