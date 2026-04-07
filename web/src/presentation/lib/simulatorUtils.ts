/**
 * Presentation: utility functions for the dynamic pricing simulator.
 */

import type { LegMode, ODRoute, RouteLeg } from "../../domain/simulator";
import { COLORS } from "./colors";

// ── Mode → SVG icon filename ────────────────────────────────────────────────

export const MODE_ICON: Record<LegMode, string> = {
  FOOT: "pedestrian.svg",
  TRAM: "metro.svg",
  BUS: "bus.svg",
  BICYCLE: "bike.svg",
  CAR: "car.svg",
};

// ── Mode → polyline color for map ───────────────────────────────────────────

export const MODE_COLOR: Record<LegMode, string> = {
  FOOT: COLORS.GRAY,
  TRAM: COLORS.BLUE,
  BUS: COLORS.BLUE_LIGHT,
  BICYCLE: COLORS.GREEN,
  CAR: COLORS.ORANGE,
};

// ── Mode → human-readable label ─────────────────────────────────────────────

export const MODE_LABEL: Record<LegMode, string> = {
  FOOT: "Walk",
  TRAM: "Tram",
  BUS: "Bus",
  BICYCLE: "Bike",
  CAR: "Car",
};

// ── Formatting helpers ──────────────────────────────────────────────────────

export function formatDuration(seconds: number): string {
  const mins = Math.round(seconds / 60);
  return `${mins} min`;
}

export function formatDistance(meters: number): string {
  if (meters >= 1000) {
    return `${(meters / 1000).toFixed(1)} km`;
  }
  return `${Math.round(meters)} m`;
}

export function formatPrice(price: number, currency: string): string {
  return `${currency} ${price.toFixed(2)}`;
}

// ── Route analysis helpers ──────────────────────────────────────────────────

/** Get unique transport modes from a route's legs (excluding FOOT). */
export function getRouteModes(legs: RouteLeg[]): LegMode[] {
  const seen = new Set<LegMode>();
  for (const leg of legs) {
    if (leg.mode !== "FOOT") seen.add(leg.mode);
  }
  return Array.from(seen);
}

/** Total walking time in seconds across all FOOT legs. */
export function getWalkingTime(legs: RouteLeg[]): number {
  return legs
    .filter((l) => l.mode === "FOOT")
    .reduce((sum, l) => sum + l.duration_s, 0);
}

/** Human-readable route label based on type and modes. */
export function getRouteLabel(route: ODRoute): string {
  switch (route.type) {
    case "Car":
      return "Private Car";
    case "PT-Only": {
      const modes = getRouteModes(route.legs);
      const modeNames = modes.map((m) => MODE_LABEL[m]);
      return modeNames.length > 0
        ? `Public Transit (${modeNames.join(" + ")})`
        : "Public Transit";
    }
    case "PT+Bike": {
      const ptModes = route.legs
        .filter((l) => l.mode !== "FOOT" && l.mode !== "BICYCLE")
        .map((l) => MODE_LABEL[l.mode]);
      const ptPart = ptModes.length > 0 ? ptModes.join(" + ") : "PT";
      return `Multimodal (Bike + ${ptPart})`;
    }
  }
}

/** Price sub-label describing the pricing context. */
export function getPriceLabel(route: ODRoute): string {
  switch (route.type) {
    case "Car":
      return "Incl. parking";
    case "PT+Bike":
      return route.optimization && route.optimization?.["Bike Price"] > 0
        ? "Discounted Bike Rate"
        : "Standard Rate";
    case "PT-Only":
      return "Standard Rate";
  }
}

/** Whether this route is the simulated choice (optimizer assigned flow). */
export function isSimulatedChoice(route: ODRoute): boolean {
  return route.optimization && route.optimization?.["Flow (q)"] > 0;
}
