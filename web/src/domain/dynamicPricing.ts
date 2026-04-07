/**
 * Domain: NSM dynamic pricing optimization dashboard types.
 */

export type DynamicPricingVariant =
  | "geneva_1km_monday08"
  | "geneva_3km_monday08";

export const DYNAMIC_PRICING_VARIANTS: DynamicPricingVariant[] = [
  "geneva_1km_monday08",
  "geneva_3km_monday08",
];

export const DYNAMIC_PRICING_FOLDER: Record<DynamicPricingVariant, string> = {
  geneva_1km_monday08: "geneva_1km_monday08",
  geneva_3km_monday08: "geneva_3km_monday08",
};

export interface InstanceConfig {
  center_lat: number;
  center_lon: number;
  radius_m: number;
  output_dir: string;
  gtfs_path: string;
  gbfs_path: string | null;
  otp_url: string;
  clustering_threshold_m: number;
  clustering_buffer_m: number;
  min_od_distance_m: number;
  seed: number;
  otp_workers: number;
  otp_request_delay_s: number;
  otp_timestamp: string;
  currency?: string;
}

export interface OptimizationParameters {
  max_displayed_alternatives: number | null;
  mult_A1: number;
  capacity: number | null;
  inventory_level: number | null;
  dep_cost: number;
  cost_bike: number;
  parking_fee: number;
  P_bar: number;
  pt_price: number;
  theta: number;
  ridership_weight: number;
  sol_method: number;
  verbose: boolean;
  verbose2: boolean;
}

export interface OptimizationMetrics {
  "Instance Name": string;
  "Solution Time (s)": number;
  "Obj Value": number;
  "Gap (%)": number;
  "Approximated Profit": number;
  Profit: number;
  Revenue: number;
  "Relaxation Difference max": number;
  "Relaxation Difference min": number;
  z_max: number;
  z_min: number;
  p_max: number;
  p_min: number;
  "Number of OD Pairs": number;
  "Total Demand": number;
  "Total Flow (Car)": number;
  "Total Flow (PT Only)": number;
  "Total Flow (Multimodal)": number;
  "Avg Bike Price (for all offered arcs)": number;
  "Avg Bike Price (Multimodal, Flow ≥ 1)": number;
  "Avg Number of Transfers (PT Only)": number;
  "Avg Number of Transfers (Multimodal)": number;
  "Total PT Only Arcs": number;
  "Used PT Only Arcs (Flow >= 1)": number;
  "Total Multimodal Arcs": number;
  "Used Multimodal Arcs (Flow >= 1)": number;
  "PT Only Arcs Usage Ratio": number;
  "Multimodal Arcs Usage Ratio": number;
}

export interface DynamicPricingData {
  instance_config: InstanceConfig;
  optimization_parameters: OptimizationParameters;
  optimization_metrics: OptimizationMetrics;
}
