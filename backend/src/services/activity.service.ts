import { supabase } from "./supabase.service";

interface LogActivityParams {
  userId: string;
  action: string;
  entityType: string;
  entityId?: string;
  durationMs?: number;
  sourceType?: string;
  relatedJobId?: string;
  relatedCompanyId?: string;
  displayTitle: string;
  details?: Record<string, any>;
}

/**
 * Log an activity entry to the activity_log table.
 * Fire-and-forget - errors are logged but never thrown.
 * This should never block the main request flow.
 */
export async function logActivity(params: LogActivityParams): Promise<void> {
  try {
    await supabase.from("activity_log").insert({
      user_id: params.userId,
      action: params.action,
      entity_type: params.entityType,
      entity_id: params.entityId || null,
      duration_ms: params.durationMs || null,
      source_type: params.sourceType || null,
      related_job_id: params.relatedJobId || null,
      related_company_id: params.relatedCompanyId || null,
      display_title: params.displayTitle,
      details: params.details || {},
    });
  } catch (error) {
    // Log error but never throw - activity logging should not break the main flow
    console.error("Failed to log activity:", error);
  }
}
