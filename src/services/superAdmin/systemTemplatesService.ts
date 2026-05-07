import { supabase } from '@/lib/supabase';
import { unwrap } from '@/lib/supabaseHelpers';
import type { Database } from '@/types/supabase';

export type TemplateKind = 'contract' | 'invoice_html' | 'email_html';
export type SystemTemplateRow = Database['smartstay']['Tables']['system_templates']['Row'];

export async function listTemplates(filters?: {
  kind?: TemplateKind;
  organizationId?: string | null;
}): Promise<SystemTemplateRow[]> {
  let q = supabase.from('system_templates').select('*').order('updated_at', { ascending: false });
  if (filters?.kind) q = q.eq('kind', filters.kind);
  if (filters?.organizationId === null) q = q.is('organization_id', null);
  else if (filters?.organizationId) q = q.eq('organization_id', filters.organizationId);
  return unwrap(q);
}

export async function createTemplate(input: {
  kind: TemplateKind;
  slug: string;
  name: string;
  content: string;
  is_default?: boolean;
  organization_id?: string | null;
}): Promise<SystemTemplateRow> {
  const row = await unwrap(
    supabase
      .from('system_templates')
      .insert({
        kind: input.kind,
        slug: input.slug.trim(),
        name: input.name.trim(),
        content: input.content,
        is_default: input.is_default ?? false,
        organization_id: input.organization_id ?? null,
      })
      .select('*')
      .single(),
  );
  return row as SystemTemplateRow;
}

export async function updateTemplate(
  id: string,
  patch: Partial<Pick<SystemTemplateRow, 'name' | 'content' | 'is_default' | 'slug'>>,
): Promise<void> {
  await unwrap(supabase.from('system_templates').update(patch).eq('id', id));
}

export async function deleteTemplate(id: string): Promise<void> {
  await unwrap(supabase.from('system_templates').delete().eq('id', id));
}
