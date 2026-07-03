export const APPLICATION_SOURCES = ['hirefire', 'manual'] as const;

export type ApplicationSource = (typeof APPLICATION_SOURCES)[number];
