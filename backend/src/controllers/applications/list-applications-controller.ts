import { listApplicationsByProfile } from '../../helpers/applications/applications-helper.js';
import type { Application } from '../../types/application.types.js';

export async function listApplicationsController(
  profileId: string,
  status?: string,
): Promise<Application[]> {
  return listApplicationsByProfile(profileId, status);
}
