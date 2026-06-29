import { deleteApplication } from '../../helpers/applications/applications-helper.js';

export async function deleteApplicationController(id: string): Promise<void> {
  await deleteApplication(id);
}
