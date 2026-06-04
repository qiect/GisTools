import * as turf from '@turf/turf'
import type { FeatureCollection, Feature, Polygon, Point } from 'geojson'

export function bufferAnalysis(geojson: FeatureCollection | Feature, radius: number, units: turf.Units = 'kilometers') {
  return turf.buffer(geojson as any, radius, { units })
}

export function intersectAnalysis(poly1: Feature<Polygon> | Polygon, poly2: Feature<Polygon> | Polygon): Feature | null {
  return turf.intersect(turf.featureCollection([poly1 as Feature<Polygon>, poly2 as Feature<Polygon>]))
}

export function unionAnalysis(poly1: Feature<Polygon> | Polygon, poly2: Feature<Polygon> | Polygon) {
  return turf.union(turf.featureCollection([poly1 as Feature<Polygon>, poly2 as Feature<Polygon>]))
}

export function differenceAnalysis(poly1: Feature<Polygon> | Polygon, poly2: Feature<Polygon> | Polygon) {
  return turf.difference(turf.featureCollection([poly1 as Feature<Polygon>, poly2 as Feature<Polygon>]))
}

export function convexHullAnalysis(geojson: FeatureCollection): Feature | null {
  return turf.convex(geojson)
}

export function centerOfMass(geojson: FeatureCollection | Feature): Feature<Point> {
  return turf.centerOfMass(geojson)
}
