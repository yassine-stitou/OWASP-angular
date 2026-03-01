import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AsvsService } from '../../services/asvs.service';
import { AiService, AIProvider, AI_PROVIDERS, ProviderConfig } from '../../services/ai.service';
import { AIRecommendation } from '../../models/asvs.model';

@Component({
  selector: 'app-recommendations',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './recommendations.component.html',
  styleUrls: ['./recommendations.component.scss']
})
export class RecommendationsComponent {
  @Input() activeLevels: number[] = [1, 2, 3];
  @Input() missingCount = 0;

  providers = AI_PROVIDERS;
  selectedProvider: AIProvider = 'groq';
  apiKey = '';
  isLoading = false;
  loadingMessage = 'Analyzing with AI...';
  error = '';
  recommendations: AIRecommendation[] = [];
  missingJson = '';
  showJsonModal = false;

  constructor(
    private asvsService: AsvsService,
    private aiService: AiService
  ) {}

  get currentProvider(): ProviderConfig {
    return this.providers.find(p => p.id === this.selectedProvider)!;
  }

  generateJSON(): void {
    const missing = this.asvsService.getMissingRequirements(this.activeLevels);
    this.missingJson = this.aiService.buildMissingJSON(missing);
    this.showJsonModal = true;
  }

  getRecommendations(): void {
    if (!this.apiKey.trim()) {
      this.error = `Please enter your ${this.currentProvider.label} API key below.`;
      return;
    }
    this.fetchRecommendations();
  }

  fetchRecommendations(): void {
    this.isLoading = true;
    this.loadingMessage = 'Analyzing with AI...';
    this.error = '';

    const missing = this.asvsService.getMissingRequirements(this.activeLevels);
    if (missing.length === 0) {
      this.error = 'No missing requirements found! Your application is fully compliant. 🎉';
      this.isLoading = false;
      return;
    }

    this.aiService.getRecommendations(missing, this.apiKey, this.selectedProvider).subscribe({
      next: (recs) => {
        this.recommendations = recs;
        this.isLoading = false;
      },
      error: (err) => {
        this.error = err.message || 'Failed to get AI recommendations.';
        this.isLoading = false;
      }
    });
  }

  copyJson(): void {
    navigator.clipboard.writeText(this.missingJson);
  }

  getPriorityColor(priority: string): string {
    if (priority === 'High') return '#ef4444';
    if (priority === 'Medium') return '#f59e0b';
    return '#22c55e';
  }

  closeModal(): void {
    this.showJsonModal = false;
  }
}
