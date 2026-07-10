/**
 * SANTA-TRANS — dynamická data webu
 * ─────────────────────────────────────────────────────────────
 * Tento soubor je jediné místo, kde se mění proměnné hodnoty.
 * Web si je načte automaticky — stačí uložit soubor a nahrát
 * ho na server (přes Netlify drag & drop nebo Git).
 *
 * Aktualizace:
 *   CNG_PRICE     → každý týden
 *   DIESEL_PRICE  → každý týden
 *   KM_MONTH      → každý měsíc (vždy za předchozí měsíc)
 *   TRANSIT_COUNT → jednou za rok (vždy za předchozí rok)
 *   VEHICLE_COUNT → při koupi nového vozidla
 * ─────────────────────────────────────────────────────────────
 */

window.ST_DATA = {

  /* ── CENY PALIV ────────────────────── */
  CNG_PRICE:     "46,700",   // Kč/kg s DPH
  DIESEL_PRICE:  "35,10",   // Kč/l s DPH

  /* ── STATISTIKY (homepage) ─────────── */
  KM_MONTH:      "574 091", // km najeto za poslední měsíc
  TRANSIT_COUNT: "33 581",  // přeprav za rok 2025
  VEHICLE_COUNT: "77",      // počet vozidel

};
