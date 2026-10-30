export const textFields = [
  ['sku', 'Koda artikla'], ['ean', 'EAN'], ['name', 'Ime artikla'], ['internal_name', 'Interno ime'],
  ['catalog_number', 'Kataloška številka'], ['category', 'Kategorija'], ['primary_group', 'Primarna skupina'],
  ['secondary_group', 'Sekundarna skupina'], ['product_type', 'Vrsta artikla'], ['unit', 'Enota'],
  ['brand', 'Znamka'], ['country_of_origin', 'Država porekla'], ['default_warehouse_location', 'Privzeta skladiščna lokacija'],
] as const;
export const numberFields = [
  ['price', 'Prodajna cena'], ['purchase_price', 'Nabavna cena'], ['wholesale_price', 'Veleprodajna cena'],
  ['vat_rate', 'DDV (%)'], ['package_qty', 'Količina v pakiranju'], ['min_stock', 'Minimalna zaloga'], ['warranty_months', 'Garancija (meseci)'],
] as const;
export function parseSupportNumber(value: string) {
  if (!/^\d+(?:\.\d{3})*(?:,\d+)?$/.test(value.trim())) throw new Error('Uporabite decimalno vejico (npr. 2.360,77).');
  return Number(value.trim().replaceAll('.', '').replace(',', '.'));
}
export const formatSupportNumber = (value: number) => value.toLocaleString('sl-SI', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
export type SupportProduct = { id: string; image_url?: string; description?: string; currency?: string } & Record<string, string | number | null | undefined>;
export function productPayload(values: Record<string, string>) {
  return {
    ...Object.fromEntries(textFields.map(([key]) => [key, values[key]?.trim() || ''])),
    ...Object.fromEntries(numberFields.map(([key]) => [key, parseSupportNumber(values[key] || '0')])),
    description: values.description || '', currency: values.currency || 'EUR', image_url: values.image_url || '',
  };
}