import { updateApplicationStatus } from '../../helpers/applications/applications-helper.js';
import type { Application } from '../../types/application.types.js';

export async function updateApplicationStatusController(
  id: string,
  status: string,
): Promise<Application> {
  return updateApplicationStatus(id, status);
}
