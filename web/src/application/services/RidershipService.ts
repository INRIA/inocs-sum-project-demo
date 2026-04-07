/**
 * Application: ridership data service.
 *
 * Builds an in-memory index keyed by (day_index, timeslot) for fast lookup,
 * and pre-computes 95th-percentile global bounds for normalisation.
 * Mirrors the V1 RidershipDataManager class.
 */

import type { RidershipFeatureCollection, RidershipProperties } from '../../domain/transit';
import type { GeoJsonFeature } from '../../domain/geo';

export type RidershipFeature = GeoJsonFeature<RidershipProperties>;
export type RidershipMetric = 'boardings' | 'alightings' | 'total';

export interface RidershipStats {
  minBoardings: number;
  maxBoardings: number;
  minAlightings: number;
  maxAlightings: number;
  minTotal: number;
  maxTotal: number;
}

function percentile(values: number[], p: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const idx = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, idx)];
}

export class RidershipService {
  private index = new Map<string, RidershipFeature[]>();
  public stats: RidershipStats = {
    minBoardings: Infinity,
    maxBoardings: -Infinity,
    minAlightings: Infinity,
    maxAlightings: -Infinity,
    minTotal: Infinity,
    maxTotal: -Infinity,
  };

  constructor(data: RidershipFeatureCollection) {
    this._buildIndex(data);
    this._computeStats(data);
  }

  private _buildIndex(data: RidershipFeatureCollection) {
    for (const feature of data.features) {
      const { day_index, timeslot } = feature.properties;
      const key = `${day_index}_${parseFloat(String(timeslot))}`;
      if (!this.index.has(key)) this.index.set(key, []);
      this.index.get(key)!.push(feature);
    }
  }

  private _computeStats(data: RidershipFeatureCollection) {
    const b: number[] = [], a: number[] = [], t: number[] = [];
    let minB = Infinity, minA = Infinity, minT = Infinity;
    for (const f of data.features) {
      const { boardings, alightings } = f.properties;
      const total = boardings + alightings;
      b.push(boardings);
      a.push(alightings);
      t.push(total);
      if (boardings < minB) minB = boardings;
      if (alightings < minA) minA = alightings;
      if (total < minT) minT = total;
    }
    this.stats = {
      minBoardings: minB,
      maxBoardings: percentile(b, 95),
      minAlightings: minA,
      maxAlightings: percentile(a, 95),
      minTotal: minT,
      maxTotal: percentile(t, 95),
    };
  }

  getFeatures(dayIndex: number, timeslot: number): RidershipFeature[] {
    return this.index.get(`${dayIndex}_${timeslot}`) ?? [];
  }

  normalize(value: number, metric: RidershipMetric): number {
    const key = metric.charAt(0).toUpperCase() + metric.slice(1) as 'Boardings' | 'Alightings' | 'Total';
    const min = this.stats[`min${key}`];
    const max = this.stats[`max${key}`];
    if (max === min) return 0.5;
    return Math.min(1, Math.max(0, (value - min) / (max - min)));
  }
}
