export interface RiverFeature {
  id: string;
  name_th: string;
  name_en: string;
  basin: string;
  basin_th: string;
  region: 'north' | 'northeast' | 'central' | 'east' | 'west' | 'south';
  connected_dams: string[]; // List of Dam IDs discharging into this river reach
  coordinates: [number, number][]; // [Longitude, Latitude] path from upstream to downstream
  major: boolean; // Major river mainstem vs tributary
}

export interface RiverNetworkData {
  type: 'FeatureCollection';
  features: Array<{
    type: 'Feature';
    id: string;
    properties: {
      name_th: string;
      name_en: string;
      basin: string;
      basin_th: string;
      region: 'north' | 'northeast' | 'central' | 'east' | 'west' | 'south';
      connected_dams: string[];
      major: boolean;
    };
    geometry: {
      type: 'LineString';
      coordinates: [number, number][];
    };
  }>;
}
