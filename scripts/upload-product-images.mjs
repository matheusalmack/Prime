import { readFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';

const env = Object.fromEntries(
  readFileSync('.env', 'utf8')
    .split(/\r?\n/)
    .filter((line) => line && !line.startsWith('#'))
    .map((line) => {
      const separator = line.indexOf('=');
      return [line.slice(0, separator), line.slice(separator + 1)];
    }),
);
const products = JSON.parse(readFileSync('supabase/seed/products.json', 'utf8'));
const client = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_PUBLISHABLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

let nextIndex = 0;
let uploaded = 0;
const failures = [];

async function worker() {
  while (nextIndex < products.length) {
    const index = nextIndex++;
    const product = products[index];
    try {
      const response = await fetch(product.source_image_url, {
        headers: { 'user-agent': 'Mozilla/5.0 Divulga catalog importer' },
      });
      if (!response.ok) throw new Error(`download ${response.status}`);
      const contentType = response.headers.get('content-type')?.split(';')[0] || 'image/jpeg';
      const bytes = await response.arrayBuffer();
      const { error } = await client.storage
        .from('product-images')
        .upload(product.image_path, bytes, { contentType, upsert: false });
      if (error && !error.message.toLowerCase().includes('already exists')) throw error;
      uploaded += 1;
      if (uploaded % 25 === 0) console.log(`${uploaded}/${products.length} imagens processadas`);
    } catch (error) {
      failures.push({ id: product.id, error: error instanceof Error ? error.message : String(error) });
    }
  }
}

await Promise.all(Array.from({ length: 10 }, () => worker()));
console.log(JSON.stringify({ total: products.length, uploaded, failures }, null, 2));
if (failures.length) process.exitCode = 1;
