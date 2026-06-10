export interface ProfilePayload {
  id?: string;
  headline: string;
  summary: string;
  skills: string[];
  experience: { title: string; company: string; description: string }[];
  preferences: { locations: string[]; remote: boolean; seniority?: string };
}
