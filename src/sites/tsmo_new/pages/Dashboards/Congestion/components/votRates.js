/**
 * Class-weighted value of time (VOT) for the TSMO dashboards — the frontend
 * mirror of the canonical backend constants in
 *   dms-template/data-types/_shared/vot_rates.js
 * (separate build tree, so the numbers are duplicated here on purpose; keep the
 * two in sync). Replaces the old flat $20/veh-hr and the ad-hoc calcCost rates.
 *
 * Rates are PER VEHICLE-HOUR with occupancy already bundled in — do NOT also
 * multiply by average vehicle occupancy. Adopted by Alex 2026-06-19, rates
 * confirmed 2026-06-22. See planning/transportny/tasks/current/class-weighted-vot-cost.md.
 *
 * ⚠ NY single-unit (FHWA 4–7) is bus-heavy — least-clean class; a transit
 * person-VOT may fit bus-dominated urban TMCs better.
 */

// 2024–25 dollars, per vehicle-hour.
export const VOT_RATES = {
  passenger: 52, // POV
  single_unit: 42, // FHWA 4–7
  combination: 77, // FHWA 8–13 tractor-trailer
};

// NY network-blended VOT_eff (~$50–55) — used where a per-TMC class split is
// unavailable (e.g. the Workzones / Congestion hero stats that only carry total
// raw vehicle-hours), instead of the old literal $20.
export const NETWORK_BLEND_VOT = 52;

/**
 * Effective class-weighted $/veh-hr for one TMC from its AADT split.
 * Falls back to the network blend (never 0) when aadt is missing/0 or the split
 * is malformed. Mirrors the backend votEff().
 */
export const votEff = ({ aadt, aadt_singl, aadt_combi } = {}) => {
  const a = Number(aadt);
  if (!Number.isFinite(a) || a <= 0) return NETWORK_BLEND_VOT;
  const s = Number(aadt_singl) || 0;
  const c = Number(aadt_combi) || 0;
  const pass = a - s - c;
  if (pass < 0) return NETWORK_BLEND_VOT;
  return (
    (pass / a) * VOT_RATES.passenger
    + (s / a) * VOT_RATES.single_unit
    + (c / a) * VOT_RATES.combination
  );
};
