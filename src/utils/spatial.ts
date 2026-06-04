import * as turf from '@turf/turf'
import type { FeatureCollection, Feature, Polygon, Point, LineString, MultiPoint } from 'geojson'

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

// 新增 Turf.js 计算方法

// 计算两点之间的距离
export function pointDistance(from: [number, number], to: [number, number], units: turf.Units = 'kilometers'): number {
  return turf.distance(turf.point(from), turf.point(to), { units })
}

// 计算要素面积
export function area(geojson: Feature | FeatureCollection): number {
  return turf.area(geojson as any)
}

// 计算线段长度
export function lineDistance(geojson: Feature<LineString> | FeatureCollection, units: turf.Units = 'kilometers'): number {
  if (geojson.type === 'FeatureCollection') {
    return geojson.features.reduce((sum, f) => sum + turf.length(f as Feature<LineString>, { units }), 0)
  }
  return turf.length(geojson as Feature<LineString>, { units })
}

// 计算方位角
export function bearingCalc(start: [number, number], end: [number, number]): number {
  return turf.bearing(turf.point(start), turf.point(end))
}

// 根据方位角和距离计算终点
export function destinationCalc(origin: [number, number], distance: number, bearing: number, units: turf.Units = 'kilometers'): Feature<Point> {
  return turf.destination(turf.point(origin), distance, bearing, { units })
}

// 计算中点
export function midpointCalc(start: [number, number], end: [number, number]): Feature<Point> {
  return turf.midpoint(turf.point(start), turf.point(end))
}

// 计算质心
export function centroidCalc(geojson: FeatureCollection | Feature): Feature<Point> {
  return turf.centroid(geojson as any)
}

// 沿线截取
export function lineSlice(start: [number, number], stop: [number, number], line: Feature<LineString>): Feature<LineString> {
  return turf.lineSlice(turf.point(start), turf.point(stop), line)
}

// 简化线/多边形
export function simplify(geojson: Feature | FeatureCollection, tolerance: number = 0.01): any {
  return turf.simplify(geojson as any, { tolerance, highQuality: false })
}

// 计算多边形内点（判断点是否在多边形内）
export function pointInPolygon(pt: [number, number], polygon: Feature<Polygon> | Polygon): boolean {
  return turf.booleanPointInPolygon(turf.point(pt), polygon as any)
}

// 生成规则网格
export function squareGrid(bbox: [number, number, number, number], cellSize: number, units: turf.Units = 'kilometers'): FeatureCollection<Polygon> {
  return turf.squareGrid(bbox, cellSize, { units })
}

// 生成三角形网格 (TIN)
export function tinAnalysis(points: FeatureCollection<Point>): FeatureCollection<Polygon> {
  return turf.tin(points)
}

// 计算沿线上指定距离处的点
export function alongCalc(line: Feature<LineString>, distance: number, units: turf.Units = 'kilometers'): Feature<Point> {
  return turf.along(line, distance, { units })
}

// 计算最近点
export function nearestPoint(target: [number, number], points: FeatureCollection<Point>): Feature<Point> & { properties: { featureIndex: number; distance: number } } {
  const fc = turf.featureCollection([turf.point(target), ...points.features])
  const result = turf.nearestPoint(turf.point(target), points)
  return result as any
}

// 生成随机点
export function randomPoints(count: number, bbox?: [number, number, number, number]): FeatureCollection<Point> {
  if (bbox) return turf.randomPoint(count, { bbox })
  return turf.randomPoint(count)
}

// 计算多边形对角线/边界框
export function bboxCalc(geojson: any): [number, number, number, number] {
  const bbox = turf.bbox(geojson)
  return [bbox[0], bbox[1], bbox[2], bbox[3]]
}
