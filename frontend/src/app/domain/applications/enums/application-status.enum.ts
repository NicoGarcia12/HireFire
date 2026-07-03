export const APPLICATION_STATUSES = [
  'postulado',
  'en_proceso',
  'entrevista',
  'oferta',
  'rechazado',
  'descartado',
] as const;

export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];
