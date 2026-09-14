import { randomUUID } from 'node:crypto';
import type { Prisma } from '../generated/prisma/client.js';

export const FIELD_INPUTS = ['text', 'email', 'password', 'textarea'] as const;
export type FieldInput = (typeof FIELD_INPUTS)[number];

export const ITEM_TYPES = ['LOGIN', 'NOTE', 'CARD', 'IDENTITY', 'CUSTOM'] as const;
export type ItemTypeValue = (typeof ITEM_TYPES)[number];

export type TemplateField = {
  id: string;
  label: string;
  input: FieldInput;
};

export type TemplateSchema = {
  builtIn: boolean;
  itemType: ItemTypeValue;
  fields: TemplateField[];
};

export const STANDARD_TEMPLATES: Array<{
  name: string;
  itemType: Exclude<ItemTypeValue, 'CUSTOM'>;
  fields: Array<{ id: string; label: string; input: FieldInput }>;
}> = [
  {
    name: 'Website',
    itemType: 'LOGIN',
    fields: [
      { id: 'name', label: 'Name', input: 'text' },
      { id: 'email', label: 'Email', input: 'email' },
      { id: 'password', label: 'Password', input: 'password' },
    ],
  },
  {
    name: 'Credit card',
    itemType: 'CARD',
    fields: [
      { id: 'name', label: 'Name', input: 'text' },
      { id: 'number', label: 'Number', input: 'text' },
      { id: 'cvv', label: 'CVV', input: 'password' },
      { id: 'expiry', label: 'Expiry date', input: 'text' },
    ],
  },
  {
    name: 'PAN card',
    itemType: 'IDENTITY',
    fields: [
      { id: 'name', label: 'Name', input: 'text' },
      { id: 'number', label: 'Number', input: 'text' },
    ],
  },
  {
    name: 'Secure note',
    itemType: 'NOTE',
    fields: [{ id: 'text', label: 'Note', input: 'textarea' }],
  },
];

export function parseTemplateSchema(value: Prisma.JsonValue): TemplateSchema {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return { builtIn: false, itemType: 'CUSTOM', fields: [] };
  }
  const raw = value as Record<string, unknown>;
  const fields = Array.isArray(raw.fields)
    ? raw.fields.flatMap((entry) => {
        if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
          return [];
        }
        const field = entry as Record<string, unknown>;
        const id = typeof field.id === 'string' ? field.id : '';
        const label = typeof field.label === 'string' ? field.label : '';
        const input = FIELD_INPUTS.includes(field.input as FieldInput)
          ? (field.input as FieldInput)
          : 'text';
        if (!id || !label) {
          return [];
        }
        return [{ id, label, input }];
      })
    : [];
  const itemType = ITEM_TYPES.includes(raw.itemType as ItemTypeValue)
    ? (raw.itemType as ItemTypeValue)
    : 'CUSTOM';
  return {
    builtIn: raw.builtIn === true,
    itemType,
    fields,
  };
}

export function newField(label: string, input: FieldInput = 'text'): TemplateField {
  return { id: randomUUID(), label: label.trim(), input };
}

function toSchema(
  itemType: Exclude<ItemTypeValue, 'CUSTOM'>,
  fields: Array<{ id: string; label: string; input: FieldInput }>,
): Prisma.InputJsonValue {
  return { builtIn: true, itemType, fields };
}

export function builtInTemplateRows(userId: string): Array<{
  userId: string;
  name: string;
  schema: Prisma.InputJsonValue;
}> {
  return STANDARD_TEMPLATES.map((template) => ({
    userId,
    name: template.name,
    schema: toSchema(template.itemType, template.fields),
  }));
}
