export interface Requirement {
  id: string;
  description: string;
  level: number[];
  cwe: number | null;
  checked?: boolean;
}

export interface Section {
  id: string;
  name: string;
  requirements: Requirement[];
}

export interface Category {
  id: string;
  name: string;
  sections: Section[];
}

export interface ComplianceScore {
  total: number;
  checked: number;
  percentage: number;
  byCategory: { [key: string]: { total: number; checked: number } };
  byLevel: { L1: { total: number; checked: number }; L2: { total: number; checked: number }; L3: { total: number; checked: number } };
}

export interface AIRecommendation {
  requirement_id: string;
  description: string;
  what_to_implement: string;
  how_to_implement: string;
  best_practices: string[];
  priority: 'High' | 'Medium' | 'Low';
}
