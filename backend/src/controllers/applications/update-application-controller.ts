import { updateApplication } from '../../helpers/applications/applications-helper.js';
import type { Application, UpdateApplicationInput } from '../../types/application.types.js';

export async function updateApplicationController(
  id: string,
  input: UpdateApplicationInput,
): Promise<Application> {
  return updateApplication(id, input);
}
