import { DamTelemetry } from '../types/dam';

export const DAMS_DATA: DamTelemetry[] = [];

export const TOP_10_DAMS = DAMS_DATA.filter((d) => d.national_rank && d.national_rank <= 10);
