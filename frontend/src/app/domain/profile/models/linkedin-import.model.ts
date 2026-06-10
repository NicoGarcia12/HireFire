import type { ProfileExperience } from './profile.model';

export interface LinkedInImport {
  headline: string;
  summary: string;
  skills: string[];
  experience: ProfileExperience[];
  filesFound: string[];
}
