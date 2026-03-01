import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { Requirement, AIRecommendation } from '../models/asvs.model';

export type AIProvider = 'gemini' | 'groq' | 'openai' | 'claude';

export interface ProviderConfig {
  id: AIProvider;
  label: string;
  hint: string;
  keyPlaceholder: string;
  freeUrl: string;
}

export const AI_PROVIDERS: ProviderConfig[] = [
  {
    id: 'claude',
    label: 'Claude',
    hint: '',
    keyPlaceholder: 'sk-ant-...',
    freeUrl: 'https://console.anthropic.com'
  },
  {
    id: 'groq',
    label: 'Groq',
    hint: '',
    keyPlaceholder: 'gsk_...',
    freeUrl: 'https://console.groq.com'
  },
  {
    id: 'gemini',
    label: 'Google Gemini',
    hint: '',
    keyPlaceholder: 'AIza...',
    freeUrl: 'https://aistudio.google.com'
  },
  {
    id: 'openai',
    label: 'OpenAI',
    hint: '',
    keyPlaceholder: 'sk-...',
    freeUrl: 'https://platform.openai.com'
  }
];

const BATCH_SIZE = 10;

@Injectable({ providedIn: 'root' })
export class AiService {
  constructor(private http: HttpClient) {}

  getRecommendations(
    missingRequirements: Requirement[],
    apiKey: string,
    provider: AIProvider = 'groq'
  ): Observable<AIRecommendation[]> {
    const prioritized = [
      ...missingRequirements.filter(r => r.level.includes(1)),
      ...missingRequirements.filter(r => !r.level.includes(1) && r.level.includes(2)),
      ...missingRequirements.filter(r => !r.level.includes(1) && !r.level.includes(2)),
    ].slice(0, BATCH_SIZE);

    switch (provider) {
      case 'groq':   return this.callGroq(prioritized, apiKey);
      case 'gemini': return this.callGemini(prioritized, apiKey);
      case 'openai': return this.callOpenAI(prioritized, apiKey);
      case 'claude':  return this.callClaude(prioritized, apiKey);
      default:       return throwError(() => new Error('Unknown provider'));
    }
  }
  private callGroq(reqs: Requirement[], apiKey: string): Observable<AIRecommendation[]> {
    const url = 'https://api.groq.com/openai/v1/chat/completions';
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    });
    const body = {
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: this.buildPrompt(reqs) }],
      temperature: 0.5,
      max_tokens: 4096
    };

    return this.http.post<any>(url, body, { headers }).pipe(
      map(res => this.parseRecommendations(res.choices?.[0]?.message?.content || '', reqs)),
      catchError(err => throwError(() => new Error(
        err?.error?.error?.message || 'Groq API error. Check your API key at console.groq.com'
      )))
    );
  }
  private callGemini(reqs: Requirement[], apiKey: string): Observable<AIRecommendation[]> {
    const model = 'gemini-2.0-flash-lite';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    const body = {
      contents: [{ parts: [{ text: this.buildPrompt(reqs) }] }],
      generationConfig: { temperature: 0.5, maxOutputTokens: 4096 }
    };

    return this.http.post<any>(url, body, { headers }).pipe(
      map(res => {
        if (res.error) throw new Error(res.error.message);
        return this.parseRecommendations(res.candidates?.[0]?.content?.parts?.[0]?.text || '', reqs);
      }),
      catchError(err => {
        const msg = err?.error?.error?.message || err?.message || '';
        if (msg.toLowerCase().includes('quota') || msg.toLowerCase().includes('rate')) {
          return throwError(() => new Error(
            'Gemini quota exceeded. Switch to Groq for a free alternative (console.groq.com).'
          ));
        }
        return throwError(() => new Error(msg || 'Gemini API error. Check your API key.'));
      })
    );
  }
  private callOpenAI(reqs: Requirement[], apiKey: string): Observable<AIRecommendation[]> {
    const url = 'https://api.openai.com/v1/chat/completions';
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    });
    const body = {
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: this.buildPrompt(reqs) }],
      temperature: 0.5,
      max_tokens: 4096
    };

    return this.http.post<any>(url, body, { headers }).pipe(
      map(res => this.parseRecommendations(res.choices?.[0]?.message?.content || '', reqs)),
      catchError(err => throwError(() => new Error(
        err?.error?.error?.message || 'OpenAI API error. Check your API key.'
      )))
    );
  }
  private callClaude(reqs: Requirement[], apiKey: string): Observable<AIRecommendation[]> {
    const url = 'https://api.anthropic.com/v1/messages';
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true'
    });
    const body = {
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      messages: [{ role: 'user', content: this.buildPrompt(reqs) }]
    };

    return this.http.post<any>(url, body, { headers }).pipe(
      map(res => this.parseRecommendations(res.content?.[0]?.text || '', reqs)),
      catchError(err => throwError(() => new Error(
        err?.error?.error?.message || 'Claude API error. Check your API key at console.anthropic.com'
      )))
    );
  }
  private buildPrompt(reqs: Requirement[]): string {
    const list = reqs.map(r =>
      `[${r.id}] ${r.description} (L${r.level.join('/L')}${r.cwe ? ', CWE-' + r.cwe : ''})`
    ).join('\n');

    return `You are an OWASP ASVS security expert. These ${reqs.length} requirements are NOT yet implemented:

${list}

Return a JSON array ONLY (no markdown, no extra text):
[{"requirement_id":"X.X.X","description":"short summary","what_to_implement":"what needs to be done","how_to_implement":"step-by-step guidance","best_practices":["practice1","practice2","practice3"],"priority":"High|Medium|Low"}]`;
  }

  private parseRecommendations(text: string, reqs: Requirement[]): AIRecommendation[] {
    try {
      const cleaned = text.replace(/```json|```/g, '').trim();
      const match = cleaned.match(/\[[\s\S]*\]/);
      if (match) return JSON.parse(match[0]);
    } catch (e) {
      console.error('Failed to parse AI response:', e);
    }
    return reqs.map(req => ({
      requirement_id: req.id,
      description: req.description.substring(0, 80),
      what_to_implement: req.description,
      how_to_implement: 'Refer to the OWASP ASVS documentation for detailed guidance.',
      best_practices: ['Follow OWASP best practices', 'Add security tests', 'Document your implementation'],
      priority: req.level.includes(1) ? 'High' as const : req.level.includes(2) ? 'Medium' as const : 'Low' as const
    }));
  }

  buildMissingJSON(requirements: Requirement[]): string {
    return JSON.stringify(
      requirements.map(r => ({
        id: r.id,
        description: r.description,
        levels: r.level.map(l => `L${l}`),
        cwe: r.cwe ? `CWE-${r.cwe}` : null
      })),
      null, 2
    );
  }
}

