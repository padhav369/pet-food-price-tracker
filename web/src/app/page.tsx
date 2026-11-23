import { createClient } from '@supabase/supabase-js';
import { cacheLife } from 'next/cache';
import PriceTable, { Product } from '../app/components/PriceTable';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function getProducts() {
  'use cache';
  cacheLife('hours');

  const { data, error } = await supabase
    .from('products')
    .select(`
      id, brand, name, animal_type, protein, weight_lbs, image_url,
      store_offers (
        store_name, regular_price, autoship_price,
        price_per_lb, autoship_price_per_lb, affiliate_url
      )
    `);

  return { data, error };
}

export default async function HomePage() {
  const { data, error } = await getProducts();

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-gray-900">
      {/* Main Comparison Dashboard */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 pt-0 pb-8">
        {error && (
          <div className="bg-red-50 border border-red-300 text-red-700 p-4 rounded-xl mb-6 text-sm">
            Supabase Connection Error: {error.message}
          </div>
        )}

        <PriceTable products={(data as Product[]) || []} />
      </main>

      {/* Full-Width About Footer */}
      <footer id="about" className="w-full border-t border-gray-200 bg-white mt-auto">
        <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 py-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-sm text-gray-600">
          <div>
            <p className="font-semibold text-gray-900">About KibblePerPound</p>
            <p className="mt-1 max-w-2xl text-xs leading-relaxed text-gray-500">
              KibblePerPound helps pet owners compare true unit prices ($/lb) across Chewy, Amazon, Petco, PetSmart, Walmart, and Target—including first-time Auto-Ship discounts. Prices are verified daily and subject to change.
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-6 text-xs font-medium text-gray-500">
            <a href="/privacy" className="hover:text-emerald-700 transition">
              Privacy Policy
            </a>
            <span>© 2026 KibblePerPound</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
