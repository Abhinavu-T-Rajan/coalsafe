/**
 * Shared Type Definitions for COALSAFE
 * 
 * Phase 0: Foundation
 * Domain models and contracts will be introduced in subsequent phases.
 */

export interface HealthResponse {
  status: "ok" | "error";
  service: string;
}
