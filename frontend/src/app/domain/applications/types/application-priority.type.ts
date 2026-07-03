export const APPLICATION_PRIORITIES = ['alta', 'media', 'baja'] as const;

export type ApplicationPriority = (typeof APPLICATION_PRIORITIES)[number];
