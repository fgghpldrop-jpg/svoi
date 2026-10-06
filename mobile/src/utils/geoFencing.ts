/**
 * СВОИ — Bobruysk Geo-Fencing & Cyber-Barrier Geometry
 * Precision geospatial boundaries, inverted masking, and perimeter barrier lines.
 */

import * as turf from '@turf/turf';

// ═══════════════════════════════════════════════════════════════
// 1. COORDINATES & CAMERA BOUNDS
// ═══════════════════════════════════════════════════════════════

/**
 * Bobruysk Epicenter: Lenin Square & Pedestrian Socialka
 * Format: [Longitude, Latitude] for MapLibre GL / GeoJSON
 */
export const BOBRUYSK_CENTER: [number, number] = [29.2214, 53.1384];

/**
 * Bounding Box (maxBounds) to physically lock the camera over Bobruysk.
 */
export const BOBRUYSK_BOUNDS = {
  sw: [29.0500, 53.0500] as [number, number],
  ne: [29.4200, 53.2500] as [number, number],
};

export const BOBRUYSK_CAMERA_CONSTRAINTS = {
  minZoomLevel: 11.5,
  maxZoomLevel: 17.5,
  defaultZoom: 13.0,
};

import rawBoundaryData from '../data/bobruyskBoundary.json';

// ═══════════════════════════════════════════════════════════════
// 2. BOBRUYSK CITY ADMINISTRATIVE BORDER POLYGON (OFFICIAL OSM)
// ═══════════════════════════════════════════════════════════════

/**
 * 319 high-precision boundary coordinates tracing the official administrative
 * perimeter of Bobruysk from OpenStreetMap (along the Berezina river curve,
 * bypasses, and industrial sectors).
 */
export const BOBRUYSK_BORDER_COORDS: [number, number][] = (
  rawBoundaryData &&
  rawBoundaryData.coordinates &&
  Array.isArray(rawBoundaryData.coordinates[0])
)
  ? (rawBoundaryData.coordinates[0] as [number, number][])
  : [
      [29.1450, 53.1850],
      [29.1900, 53.2050],
      [29.2550, 53.2000],
      [29.2900, 53.1800],
      [29.2950, 53.1450],
      [29.2750, 53.1150],
      [29.2450, 53.0850],
      [29.1850, 53.0800],
      [29.1350, 53.1100],
      [29.1200, 53.1500],
      [29.1450, 53.1850],
    ];

// ═══════════════════════════════════════════════════════════════
// 3. INVERTED MASK GENERATION (WORLD WITH A HOLE)
// ═══════════════════════════════════════════════════════════════

/**
 * Generates an inverted world mask GeoJSON polygon.
 * The outer ring covers the entire globe, and the city border acts as an inner hole.
 * Everything outside Bobruysk will be rendered in dark graphite (#07090E, 88% opacity).
 */
export function generateInvertedMask(cityPolygonCoords: [number, number][] = BOBRUYSK_BORDER_COORDS) {
  // Ensure the hole polygon is closed
  const closedHole = [...cityPolygonCoords];
  const first = closedHole[0];
  const last = closedHole[closedHole.length - 1];
  if (first[0] !== last[0] || first[1] !== last[1]) {
    closedHole.push(first);
  }

  // World bounding ring covering entire globe
  const worldRing: [number, number][] = [
    [-180.0, -85.0],
    [180.0, -85.0],
    [180.0, 85.0],
    [-180.0, 85.0],
    [-180.0, -85.0],
  ];

  return {
    type: 'FeatureCollection' as const,
    features: [
      {
        type: 'Feature' as const,
        id: 'world-inverted-mask',
        properties: {
          maskColor: '#07090E',
          maskOpacity: 0.88,
        },
        geometry: {
          type: 'Polygon' as const,
          coordinates: [worldRing, closedHole],
        },
      },
    ],
  };
}

/**
 * Generates a GeoJSON LineString of the perimeter barrier.
 * Used for the neon glow and core cyber-barrier lines.
 */
export function getBarrierBorderGeoJSON(cityPolygonCoords: [number, number][] = BOBRUYSK_BORDER_COORDS) {
  const closed = [...cityPolygonCoords];
  const first = closed[0];
  const last = closed[closed.length - 1];
  if (first[0] !== last[0] || first[1] !== last[1]) {
    closed.push(first);
  }

  return {
    type: 'FeatureCollection' as const,
    features: [
      {
        type: 'Feature' as const,
        id: 'barrier-perimeter-line',
        properties: {
          glowColor: '#10B981',
          coreColor: '#34D399',
        },
        geometry: {
          type: 'LineString' as const,
          coordinates: closed,
        },
      },
    ],
  };
}

// ═══════════════════════════════════════════════════════════════
// 4. POINT-IN-POLYGON GEOFENCING CHECK
// ═══════════════════════════════════════════════════════════════

/**
 * Checks if a given coordinate [longitude, latitude] is inside Bobruysk.
 * Uses Turf.js booleanPointInPolygon with fallback to ray-casting.
 */
export function isPointInsideBobruysk(lng: number, lat: number): boolean {
  try {
    const pt = turf.point([lng, lat]);
    const poly = turf.polygon([BOBRUYSK_BORDER_COORDS]);
    return turf.booleanPointInPolygon(pt, poly);
  } catch {
    // Ray-casting fallback
    let inside = false;
    const polygon = BOBRUYSK_BORDER_COORDS;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const xi = polygon[i][0];
      const yi = polygon[i][1];
      const xj = polygon[j][0];
      const yj = polygon[j][1];

      const intersect = yi > lat !== yj > lat && lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi;
      if (intersect) inside = !inside;
    }
    return inside;
  }
}
