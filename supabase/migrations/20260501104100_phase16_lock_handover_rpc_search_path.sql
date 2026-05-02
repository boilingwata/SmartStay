alter function smartstay.create_handover_checklist_v1(
  bigint,
  bigint,
  smartstay.handover_type,
  uuid,
  uuid,
  text,
  text,
  text,
  jsonb,
  jsonb
) set search_path = smartstay, pg_temp;
