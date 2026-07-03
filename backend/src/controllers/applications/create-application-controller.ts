import { createApplication } from '../../helpers/applications/applications-helper.js';
import type { Application, CreateApplicationInput } from '../../types/application.types.js';

export async function createApplicationController(
  input: CreateApplicationInput,
): Promise<Application> {
  return createApplication(input);
}
