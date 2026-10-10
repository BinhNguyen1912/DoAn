import type { components, paths } from './schema.js';

export type { components, paths };
export type Schemas = components['schemas'];
export type Zone = Schemas['ZoneResponseDto'];
export type ZonePoint = Schemas['ZonePointDto'];
export type Device = Schemas['DeviceResponseDto'];
export type SafeZoneEvent = Schemas['EventResponseDto'];
export type AlertAttempt = Schemas['AlertAttemptResponseDto'];
