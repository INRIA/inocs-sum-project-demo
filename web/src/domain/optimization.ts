/**
 * Domain: Optimization model result types for the dynamic pricing demo.
 */

// ---- meta.json ----
export interface OptimizationMeta {
  random_seed: number | null;
  instance_nodes: number;
  instance_od_pairs: number;
  clustering: {
    method: string;
    threshold: number;
    buffer: number;
  };
  optimization: {
    M: number;
    max_displayed_alts: number | null;
    ridership_weight: number | null;
  };
  generation: {
    fixed_pt_price_value: number | null;
    bike_cost_operator: number | null;
    bike_station_count: number;
  };
  solution: {
    objective: number;
    gap_percent: number;
    solve_time_s: number;
  };
}

// ---- cluster_nodes.json ----
export interface ClusterNode {
  cluster_id: string | number;
  lat: number;
  lon: number;
  label?: string;
  /** convex hull polygon coordinates [[lng,lat], ...] */
  hull?: Array<[number, number]>;
}

// ---- arcs_od_options.json ----
export interface TripOption {
  origin_cluster: string | number;
  destination_cluster: string | number;
  option_index: number;
  /** e.g. "bike+pt", "pt", "car" */
  mode: string;
  price: number;
  duration_min: number;
  transfers: number;
  flow: number;
  is_chosen: boolean;
  /** [lng, lat] of transfer point, if any */
  transfer_point?: [number, number];
}
