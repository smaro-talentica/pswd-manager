import { api } from '@/utils/api'

export type FieldInput = 'text' | 'email' | 'password' | 'textarea'

export type TemplateFieldDef = {
  id: string
  label: string
  input: FieldInput
}

export type VaultTemplate = {
  id: string
  name: string
  builtIn: boolean
  itemType: 'LOGIN' | 'NOTE' | 'CARD' | 'IDENTITY' | 'CUSTOM'
  fields: TemplateFieldDef[]
  createdAt: string
}

export function listTemplates() {
  return api<VaultTemplate[]>('/api/templates')
}

export function createTemplate(name: string, fields: Array<{ label: string; input?: FieldInput }>) {
  return api<VaultTemplate>('/api/templates', {
    method: 'POST',
    body: JSON.stringify({ name, fields }),
  })
}

export function updateTemplate(
  templateId: string,
  name: string,
  fields: Array<{ label: string; input?: FieldInput }>,
) {
  return api<VaultTemplate>(`/api/templates/${templateId}`, {
    method: 'PATCH',
    body: JSON.stringify({ name, fields }),
  })
}

export function addTemplateField(templateId: string, label: string, input: FieldInput = 'text') {
  return api<VaultTemplate>(`/api/templates/${templateId}/fields`, {
    method: 'POST',
    body: JSON.stringify({ label, input }),
  })
}

export function deleteTemplate(templateId: string) {
  return api<void>(`/api/templates/${templateId}`, { method: 'DELETE' })
}
