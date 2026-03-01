# OWASP ASVS Security Checker 🛡️

An Angular 17 application for auditing your application's compliance with the **OWASP Application Security Verification Standard (ASVS) v4.0**.

## Features

- ✅ **Full ASVS v4.0 Checklist** — All 14 categories, organized by sections
- 📊 **Real-time Compliance Score** — L1 / L2 / L3 breakdown with progress bars
- 🔍 **Search & Filter** — Filter by security level or search by keyword/CWE
- 💾 **Persistent Progress** — Save/load your progress via localStorage
- 🤖 **AI Recommendations** — Send missing controls to Google Gemini for guidance
- 📄 **JSON Export** — Export missing requirements as structured JSON

## Getting Started

### Prerequisites
- Node.js 18+
- Angular CLI 17+

```bash
npm install -g @angular/cli
```

### Installation

```bash
npm install
ng serve
```

Then open [http://localhost:4200](http://localhost:4200)

## Using the AI Recommendations

1. Complete the checklist by checking off implemented controls
2. Click the **AI Recommendations** tab
3. Click **Get AI Recommendations**
4. Enter your **Google AI Studio API key** (free at [aistudio.google.com](https://aistudio.google.com))
5. Receive detailed guidance for each missing control

## Project Structure

```
src/
├── app/
│   ├── components/
│   │   ├── header/          # App header with compliance ring
│   │   ├── score-card/      # L1/L2/L3 score breakdown
│   │   ├── checklist/       # Interactive ASVS checklist
│   │   └── recommendations/ # AI recommendations panel
│   ├── models/
│   │   └── asvs.model.ts    # TypeScript interfaces
│   └── services/
│       ├── asvs.service.ts  # Checklist state management
│       └── ai.service.ts    # Google Gemini AI integration
└── assets/
    └── asvs-data.json       # Full ASVS v4.0 dataset
```

## ASVS Coverage

The checklist covers all 14 ASVS chapters:
- V1: Architecture, Design and Threat Modeling
- V2: Authentication
- V3: Session Management
- V4: Access Control
- V5: Validation, Sanitization and Encoding
- V6: Stored Cryptography
- V7: Error Handling and Logging
- V8: Data Protection
- V9: Communication
- V10: Malicious Code
- V11: Business Logic
- V12: Files and Resources
- V13: API and Web Service
- V14: Configuration

## Security Levels

| Level | Description | Suitable For |
|-------|-------------|--------------|
| **L1** | Basic | All applications |
| **L2** | Standard | Apps handling sensitive data |
| **L3** | Advanced | High-value / critical systems |

## Building for Production

```bash
ng build --configuration=production
```

Output will be in `dist/owasp-asvs-checker/`.

---

Built with ❤️ using Angular 17 + Google Gemini AI
