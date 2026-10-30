import { z } from 'npm:zod@3.25.76';

const text = z.string().trim().max(2000);
const amount = z.number().finite().nonnegative();
export const productSchema = z.object({
  ean: text.min(1).max(100), name: text.min(1).max(255), price: amount,
  min_stock: z.number().int().nonnegative(), category: text,
  sku: text, catalog_number: text, internal_name: text, description: text,
  primary_group: text, secondary_group: text, product_type: text, unit: text,
  package_qty: amount, brand: text, country_of_origin: text,
  warranty_months: z.number().int().nonnegative(), currency: z.string().regex(/^[A-Z]{3}$/),
  wholesale_price: amount, vat_rate: amount.max(100), purchase_price: amount,
  default_warehouse_location: text, image_url: z.union([z.literal(''), z.string().url().max(2000)]),
}).strict();