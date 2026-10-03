export type ContactCategory = 'all' | 'emergency' | 'water' | 'traffic' | 'health';

export interface EmergencyContact {
  id: string;
  category: 'emergency' | 'water' | 'traffic' | 'health';
  nameTh: string;
  nameEn: string;
  shortNameTh: string;
  shortNameEn: string;
  phone: string;
  altPhone?: string;
  descriptionTh: string;
  descriptionEn: string;
  website?: string;
  is24Hours: boolean;
  isTollFree?: boolean;
  priority?: number; // lower number = higher priority
  badgeTh?: string;
  badgeEn?: string;
  agencyKey?: 'RID' | 'EGAT' | 'DDPM' | 'TMD' | 'ONWR' | 'HII' | 'BMA';
}
