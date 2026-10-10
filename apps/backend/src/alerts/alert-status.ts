/**
 * Lifecycle of one speaker command. HTTP success from the ESP32 only means
 * `received`; `playing` and `done` must come from the device itself.
 */
export const ALERT_STATUSES = ['sent', 'received', 'playing', 'done', 'failed'] as const;
export type AlertStatus = (typeof ALERT_STATUSES)[number];
