import * as THREE from 'three';
import { RegionId } from '../types/dam';

// Center reference point for Thailand
export const THAILAND_CENTER_LNG = 100.5;
export const THAILAND_CENTER_LAT = 13.5;
export const GEO_SCALE = 0.55;

/**
 * Convert geographic Longitude/Latitude into Three.js 3D coordinates
 */
export function geoTo3D(
  lng: number,
  lat: number,
  elevation: number = 0.05
): [number, number, number] {
  const x = (lng - THAILAND_CENTER_LNG) * GEO_SCALE;
  const y = (lat - THAILAND_CENTER_LAT) * GEO_SCALE;
  return [x, y, elevation];
}

/**
 * Region color mapping according to Design.md (Tactile matte clay palette)
 */
export const REGION_COLORS: Record<RegionId, { base: string; highlight: string; elevation: number }> = {
  all: { base: '#94A3B8', highlight: '#38BDF8', elevation: 0.1 },
  north: { base: '#86EFAC', highlight: '#22C55E', elevation: 0.22 },      // 🌿 Mint / Sage Green (ภูเขาสูง ป่าไม้)
  northeast: { base: '#FDBA74', highlight: '#F97316', elevation: 0.16 },  // 🍑 Warm Coral / Peach (ที่ราบสูงโคราช)
  central: { base: '#FDE68A', highlight: '#FACC15', elevation: 0.1 },    // 🌾 Butter Yellow (ที่ราบลุ่ม อู่ข้าวอู่น้ำ)
  west: { base: '#DDD6FE', highlight: '#8B5CF6', elevation: 0.2 },       // 🪻 Soft Lavender (เทือกเขาตะนาวศรี)
  east: { base: '#FDA4AF', highlight: '#F43F5E', elevation: 0.14 },      // 🌸 Rose Pink (พื้นที่ชายฝั่ง EEC)
  south: { base: '#7DD3FC', highlight: '#0EA5E9', elevation: 0.15 }      // 🌊 Sky Aqua (คาบสมุทร ทะเลใต้)
};

/**
 * Build THREE.Shape list from a GeoJSON MultiPolygon coordinate array
 */
export function createShapesFromMultiPolygon(
  coordinates: number[][][][]
): THREE.Shape[] {
  const shapes: THREE.Shape[] = [];

  for (const polygon of coordinates) {
    if (!polygon || polygon.length === 0) continue;

    // Outer boundary ring
    const exterior = polygon[0];
    if (!exterior || exterior.length < 3) continue;

    const shape = new THREE.Shape();
    const [startLng, startLat] = exterior[0];
    const startX = (startLng - THAILAND_CENTER_LNG) * GEO_SCALE;
    const startY = (startLat - THAILAND_CENTER_LAT) * GEO_SCALE;
    shape.moveTo(startX, startY);

    for (let i = 1; i < exterior.length; i++) {
      const [lng, lat] = exterior[i];
      const x = (lng - THAILAND_CENTER_LNG) * GEO_SCALE;
      const y = (lat - THAILAND_CENTER_LAT) * GEO_SCALE;
      shape.lineTo(x, y);
    }

    // Optional holes inside polygon
    for (let h = 1; h < polygon.length; h++) {
      const hole = polygon[h];
      if (!hole || hole.length < 3) continue;
      const holePath = new THREE.Path();
      const [hStartLng, hStartLat] = hole[0];
      holePath.moveTo(
        (hStartLng - THAILAND_CENTER_LNG) * GEO_SCALE,
        (hStartLat - THAILAND_CENTER_LAT) * GEO_SCALE
      );
      for (let j = 1; j < hole.length; j++) {
        const [hlng, hlat] = hole[j];
        holePath.lineTo(
          (hlng - THAILAND_CENTER_LNG) * GEO_SCALE,
          (hlat - THAILAND_CENTER_LAT) * GEO_SCALE
        );
      }
      shape.holes.push(holePath);
    }

    shapes.push(shape);
  }

  return shapes;
}

/**
 * Convert GeoJSON MultiPolygon into SVG Path string for 2D Fallback Map
 */
export function multiPolygonToSvgPath(
  coordinates: number[][][][],
  width: number,
  height: number,
  bounds: { minLng: number; maxLng: number; minLat: number; maxLat: number }
): string {
  const { minLng, maxLng, minLat, maxLat } = bounds;
  const lngRange = maxLng - minLng;
  const latRange = maxLat - minLat;

  const project = (lng: number, lat: number): [number, number] => {
    const x = ((lng - minLng) / lngRange) * (width * 0.9) + width * 0.05;
    // Invert Y for SVG coordinates (latitude increases upwards, SVG y increases downwards)
    const y = ((maxLat - lat) / latRange) * (height * 0.9) + height * 0.05;
    return [x, y];
  };

  let pathD = '';
  for (const polygon of coordinates) {
    for (const ring of polygon) {
      if (ring.length === 0) continue;
      const [p0x, p0y] = project(ring[0][0], ring[0][1]);
      pathD += ` M ${p0x.toFixed(1)} ${p0y.toFixed(1)}`;
      for (let i = 1; i < ring.length; i++) {
        const [px, py] = project(ring[i][0], ring[i][1]);
        pathD += ` L ${px.toFixed(1)} ${py.toFixed(1)}`;
      }
      pathD += ' Z';
    }
  }
  return pathD;
}

/**
 * Approximate terrain elevation based on geographic coordinates for smooth river draping.
 * When a region is drilled down (selectedRegion !== 'all'), provinces in that region
 * pop up with +0.08 depth. We boost elevation accordingly so rivers stay on the top surface.
 */
export function getTerrainElevation(
  lng: number,
  lat: number,
  selectedRegion?: RegionId,
  riverRegion?: RegionId
): number {
  let baseElev = 0.11; // Central plains

  if (lat >= 17.0) {
    baseElev = 0.23; // North mountain ranges
  } else if (lat >= 16.0) {
    if (lng > 101.5) baseElev = 0.17; // Isan Khorat plateau
    else baseElev = 0.19; // Lower North
  } else if (lat >= 13.8 && lng < 99.8) {
    baseElev = 0.21; // West Kanchanaburi
  } else if (lat >= 14.2 && lng > 101.2) {
    baseElev = 0.17; // Isan Mun basin
  } else if (lng > 101.2 && lat < 14.2 && lat >= 12.5) {
    baseElev = 0.15; // East coast
  } else if (lat < 11.5) {
    baseElev = 0.16; // South peninsula
  } else if (lat < 13.6) {
    baseElev = 0.08; // River mouth / Gulf of Thailand
  } else {
    baseElev = 0.11; // Central
  }

  // Drill-down elevation boost:
  // If this river belongs to the active region or if the point falls inside the active region,
  // raise the elevation by +0.085 to perfectly drape above the +0.08 extruded region mesh
  if (selectedRegion && selectedRegion !== 'all') {
    const isMatchingRiverRegion = riverRegion === selectedRegion;
    let isPointInSelected = false;

    if (selectedRegion === 'north' && (lat >= 16.0 && lng <= 101.5)) isPointInSelected = true;
    else if (selectedRegion === 'northeast' && ((lat >= 16.0 && lng > 101.5) || (lat >= 14.2 && lng > 101.2))) isPointInSelected = true;
    else if (selectedRegion === 'central' && (lat >= 13.5 && lat < 16.0 && lng >= 99.8 && lng <= 101.2)) isPointInSelected = true;
    else if (selectedRegion === 'west' && (lat >= 11.5 && lat <= 16.0 && lng < 99.8)) isPointInSelected = true;
    else if (selectedRegion === 'east' && (lat >= 12.5 && lat < 14.2 && lng > 101.2)) isPointInSelected = true;
    else if (selectedRegion === 'south' && lat < 11.5) isPointInSelected = true;

    if (isMatchingRiverRegion || isPointInSelected) {
      baseElev += 0.088;
    }
  }

  return baseElev;
}

/**
 * Convert GeoJSON LineString coordinates into Three.js Vector3 array for 3D lines/curves
 */
export function lineStringTo3DPoints(
  coordinates: [number, number][],
  elevationOffset: number = 0.02,
  selectedRegion?: RegionId,
  riverRegion?: RegionId
): THREE.Vector3[] {
  return coordinates.map(([lng, lat]) => {
    const elev = getTerrainElevation(lng, lat, selectedRegion, riverRegion) + elevationOffset;
    const [x, y, z] = geoTo3D(lng, lat, elev);
    return new THREE.Vector3(x, y, z);
  });
}

/**
 * Convert GeoJSON LineString coordinates into SVG Path string for 2D Fallback Map
 */
export function lineStringToSvgPath(
  coordinates: [number, number][],
  width: number,
  height: number,
  bounds: { minLng: number; maxLng: number; minLat: number; maxLat: number }
): string {
  if (!coordinates || coordinates.length < 2) return '';

  const { minLng, maxLng, minLat, maxLat } = bounds;
  const lngRange = maxLng - minLng;
  const latRange = maxLat - minLat;

  const project = (lng: number, lat: number): [number, number] => {
    const x = ((lng - minLng) / lngRange) * (width * 0.9) + width * 0.05;
    const y = ((maxLat - lat) / latRange) * (height * 0.9) + height * 0.05;
    return [x, y];
  };

  const [p0x, p0y] = project(coordinates[0][0], coordinates[0][1]);
  let pathD = `M ${p0x.toFixed(1)} ${p0y.toFixed(1)}`;

  for (let i = 1; i < coordinates.length; i++) {
    const [px, py] = project(coordinates[i][0], coordinates[i][1]);
    pathD += ` L ${px.toFixed(1)} ${py.toFixed(1)}`;
  }

  return pathD;
}
