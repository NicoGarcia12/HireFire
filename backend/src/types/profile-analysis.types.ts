export interface ProfileSuggestion {
  section: 'headline' | 'summary' | 'skills' | 'experience' | 'general';
  priority: 'alta' | 'media' | 'baja';
  issue: string;
  suggestion: string;
}

export interface ProfileAnalysis {
  score: number;
  strengths: string[];
  suggestions: ProfileSuggestion[];
}
