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

export const UNIFORM_TERRAIN_ELEVATION = 0.15;

/**
 * Region color mapping according to Design.md (Tactile matte clay palette)
 * With uniform low-relief extrusion depth across all regions
 */
export const REGION_COLORS: Record<RegionId, { base: string; highlight: string; elevation: number }> = {
  all: { base: '#94A3B8', highlight: '#38BDF8', elevation: UNIFORM_TERRAIN_ELEVATION },
  north: { base: '#86EFAC', highlight: '#22C55E', elevation: UNIFORM_TERRAIN_ELEVATION },
  northeast: { base: '#FDBA74', highlight: '#F97316', elevation: UNIFORM_TERRAIN_ELEVATION },
  central: { base: '#FDE68A', highlight: '#FACC15', elevation: UNIFORM_TERRAIN_ELEVATION },
  west: { base: '#DDD6FE', highlight: '#8B5CF6', elevation: UNIFORM_TERRAIN_ELEVATION },
  east: { base: '#FDA4AF', highlight: '#F43F5E', elevation: UNIFORM_TERRAIN_ELEVATION },
  south: { base: '#7DD3FC', highlight: '#0EA5E9', elevation: UNIFORM_TERRAIN_ELEVATION }
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
 * Create a solid 2D ribbon mesh geometry from a geographic polygon ring.
 * Solves WebGL 1px line limitations by generating real polygonal quad strips
 * with configurable physical world width.
 */
export function createRibbonGeometryFromRing(
  ring: [number, number][],
  width: number = 0.012,
  elevation: number = 0.1
): THREE.BufferGeometry | null {
  const n = ring.length;
  if (n < 3) return null;

  const vertices: number[] = [];
  const indices: number[] = [];

  for (let i = 0; i < n; i++) {
    const prev = ring[(i - 1 + n) % n];
    const curr = ring[i];
    const next = ring[(i + 1) % n];

    // Convert coords to 3D plane
    const prevX = (prev[0] - THAILAND_CENTER_LNG) * GEO_SCALE;
    const prevY = (prev[1] - THAILAND_CENTER_LAT) * GEO_SCALE;
    const nextX = (next[0] - THAILAND_CENTER_LNG) * GEO_SCALE;
    const nextY = (next[1] - THAILAND_CENTER_LAT) * GEO_SCALE;
    const currX = (curr[0] - THAILAND_CENTER_LNG) * GEO_SCALE;
    const currY = (curr[1] - THAILAND_CENTER_LAT) * GEO_SCALE;

    // 2D tangent and perpendicular normal
    const dx = nextX - prevX;
    const dy = nextY - prevY;
    const len = Math.hypot(dx, dy) || 1;
    const nx = -dy / len;
    const ny = dx / len;

    // Left vertex
    vertices.push(currX + nx * (width / 2), currY + ny * (width / 2), elevation);
    // Right vertex
    vertices.push(currX - nx * (width / 2), currY - ny * (width / 2), elevation);

    if (i < n - 1) {
      const idx = i * 2;
      indices.push(idx, idx + 1, idx + 2);
      indices.push(idx + 1, idx + 3, idx + 2);
    }
  }

  const geom = new THREE.BufferGeometry();
  geom.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geom.setIndex(indices);
  geom.computeVertexNormals();
  return geom;
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
  _lng?: number,
  _lat?: number,
  _selectedRegion?: RegionId,
  _riverRegion?: RegionId
): number {
  // Uniform terrain top surface elevation across all of Thailand
  return UNIFORM_TERRAIN_ELEVATION + 0.015;
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
