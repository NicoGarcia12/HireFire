export interface ProfileExperience {
  title: string;
  company: string;
  description: string;
}

export interface ProfilePreferences {
  locations: string[];
  remote: boolean;
  seniority?: string;
}

export interface Profile {
  id: string;
  headline: string;
  summary: string;
  skills: string[];
  experience: ProfileExperience[];
  preferences: ProfilePreferences;
}
