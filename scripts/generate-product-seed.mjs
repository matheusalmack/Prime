import { mkdirSync, writeFileSync } from 'node:fs';
import productsPart1 from '../src/shopeeProductsPart1.js';
import productsPart2 from '../src/shopeeProductsPart2.js';
import productsPart3 from '../src/shopeeProductsPart3.js';
import productsPart4 from '../src/shopeeProductsPart4.js';
import productsPart5 from '../src/shopeeProductsPart5.js';

const folder = 'catalog-20260914-a84f65';
const products = [productsPart1, productsPart2, productsPart3, productsPart4, productsPart5].flat();

function priceToCents(value) {
  const normalized = String(value).replace(/[^\d,.-]/g, '').replaceAll('.', '').replace(',', '.');
  return Math.round(Number.parseFloat(normalized) * 100);
}

const rows = products.map((product) => {
  const imagePath = `${folder}/${product.id}`;
  return {
    id: product.id,
    item_id: String(product.itemId),
    shop_id: String(product.shopId),
    name: product.name,
    category: product.category,
    source_image_url: product.image,
    image_path: imagePath,
    image_url: `https://ikgilxwdllxyjmufvtqh.supabase.co/storage/v1/object/public/product-images/${imagePath}`,
    source_url: product.url,
    price_cents: priceToCents(product.price),
    currency: product.currency || 'BRL',
    commission_rate: product.commission,
    sales_count: product.sales,
    source_data: product,
  };
});

const json = JSON.stringify(rows).replaceAll('$seed$', '$ seed $');
const sql = `-- Catálogo original importado da coleta da Shopee.
insert into public.products (
  id, item_id, shop_id, name, category, source_image_url, image_path, image_url,
  source_url, price_cents, currency, commission_rate, sales_count, source_data
)
select
  row.id, row.item_id, row.shop_id, row.name, row.category, row.source_image_url,
  row.image_path, row.image_url, row.source_url, row.price_cents, row.currency,
  row.commission_rate, row.sales_count, row.source_data
from jsonb_to_recordset($seed$${json}$seed$::jsonb) as row(
  id text, item_id text, shop_id text, name text, category text,
  source_image_url text, image_path text, image_url text, source_url text,
  price_cents integer, currency text, commission_rate numeric, sales_count bigint,
  source_data jsonb
)
on conflict (id) do update set
  item_id = excluded.item_id,
  shop_id = excluded.shop_id,
  name = excluded.name,
  category = excluded.category,
  source_image_url = excluded.source_image_url,
  image_path = excluded.image_path,
  image_url = excluded.image_url,
  source_url = excluded.source_url,
  price_cents = excluded.price_cents,
  currency = excluded.currency,
  commission_rate = excluded.commission_rate,
  sales_count = excluded.sales_count,
  source_data = excluded.source_data,
  is_active = true;

drop policy if exists "temporary_catalog_image_import" on storage.objects;
create policy "temporary_catalog_image_import" on storage.objects
for insert to anon
with check (
  bucket_id = 'product-images'
  and (storage.foldername(name))[1] = '${folder}'
);
`;

mkdirSync('supabase/seed', { recursive: true });
writeFileSync('supabase/migrations/20260914173000_seed_products.sql', sql);
writeFileSync('supabase/seed/products.json', JSON.stringify(rows, null, 2));
console.log(`Gerados ${rows.length} produtos em ${folder}.`);
