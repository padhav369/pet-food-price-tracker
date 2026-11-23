'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';


const ROWS_PER_PAGE = 15;
const STORES = ['Chewy', 'Amazon', 'Petco', 'PetSmart', 'Walmart', 'Target'] as const;
const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
const cell = 'border-r border-gray-300 px-3 py-3 text-center whitespace-nowrap';

const STORE_SEARCH_URLS: Record<(typeof STORES)[number], string> = {
    Chewy: "https://www.chewy.com/s?query=",
    Amazon: "https://www.amazon.com/s?k=",
    Petco: "https://www.petco.com/shop/en/petcostore/search?query=",
    PetSmart: "https://www.petsmart.com/search/?q=",
    Walmart: "https://www.walmart.com/search?q=",
    Target: "https://www.target.com/s?searchTerm=",
};

function getStoreSearchUrl(
    store: (typeof STORES)[number],
    product: Product,
    affiliateUrl?: string
) {
    // 1. If we already have a real direct product deep link (from Impact/Amazon APIs), use it
    const isDirectProductLink =
        affiliateUrl &&
        !affiliateUrl.endsWith('.com') &&
        !affiliateUrl.endsWith('.com/') &&
        !affiliateUrl.includes('/s?') &&
        !affiliateUrl.includes('/search');

    if (isDirectProductLink) {
        return affiliateUrl;
    }

    // 2. Otherwise, search by clean Brand + Name (without metric decimal weights like "17.64 lb")
    const cleanName = product.name
        .replace(/\b\d+(\.\d+)?\s*(lb|lbs|oz|kg|g)\b/gi, '')
        .replace(/\s+/g, ' ')
        .trim();
    const query = `${product.brand} ${cleanName}`.trim();

    return `${STORE_SEARCH_URLS[store]}${encodeURIComponent(query)}`;
}


export type StoreOffer = {
    store_name: string;
    regular_price: number;
    autoship_price: number | null;
    price_per_lb: number;
    autoship_price_per_lb: number | null;
    affiliate_url: string;
};

export type Product = {
    id: number;
    brand: string;
    name: string;
    animal_type: string;
    protein: string;
    weight_lbs: number;
    image_url?: string | null;
    store_offers: StoreOffer[];
};

function PawIcon({ className }: { className: string }) {
    return (
        <svg aria-hidden="true" viewBox="0 0 64 64" className={className}>
            <ellipse cx="11" cy="28" rx="6" ry="9" transform="rotate(-25 11 28)" />
            <ellipse cx="23" cy="14" rx="7" ry="10" transform="rotate(-14 23 14)" />
            <ellipse cx="41" cy="14" rx="7" ry="10" transform="rotate(14 41 14)" />
            <ellipse cx="53" cy="28" rx="6" ry="9" transform="rotate(25 53 28)" />
            <path fillRule="evenodd" d="M32 25c-9 0-21 15-21 24 0 7 6 10 12 8 4-1 6-3 9-3s5 2 9 3c6 2 12-1 12-8 0-9-12-24-21-24Zm0 24-7-7a4.5 4.5 0 0 1 7-5 4.5 4.5 0 0 1 7 5l-7 7Z" />
        </svg>
    );
}

function ProductThumbnail({ imageUrl }: { imageUrl?: string | null }) {
    const [failed, setFailed] = useState(false);
    const src = imageUrl?.trim();

    if (!src || failed) {
        return (
            <div aria-hidden="true" className="grid h-16 w-12 place-items-center rounded-md bg-emerald-50">
                <PawIcon className="h-7 w-7 fill-[#126b47]" />
            </div>
        );
    }

    return (
        <Image
            src={src}
            alt=""
            loading="lazy"
            width={65}
            height={80}
            className="h-full w-full object-contain"
            onError={() => setFailed(true)}
        />
    );
}


export default function PriceTable({ products }: { products: Product[] }) {
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [brand, setBrand] = useState('');
    const [pet, setPet] = useState('');
    const [isAutoship, setIsAutoship] = useState(false);

    const brands = useMemo(() => [...new Set(products.map((p) => p.brand))].sort(), [products]);
    const pets = useMemo(
        () => [...new Set(products.map((p) => p.animal_type.trim().toLowerCase()).filter(Boolean))].sort(),
        [products]
    );

    const rows = useMemo(() => {
        const query = search.trim().toLowerCase();

        return products
            .filter((product) =>
                (!brand || product.brand === brand) &&
                (!pet || product.animal_type.trim().toLowerCase() === pet) &&
                `${product.brand} ${product.name}`.toLowerCase().includes(query)
            )
            .map((product) => {
                const offers = STORES.map((store) => {
                    const offer = product.store_offers.find((item) => item.store_name === store);
                    if (!offer) return null;

                    const usesAutoship = isAutoship && offer.autoship_price != null;
                    const price = Number(usesAutoship ? offer.autoship_price : offer.regular_price);
                    if (!Number.isFinite(price) || price < 0) return null;

                    return { ...offer, price, usesAutoship };
                });
                const best = offers.reduce<(typeof offers)[number]>((lowest, offer) =>
                    offer && (!lowest || offer.price < lowest.price) ? offer : lowest,
                    null
                );
                const weight = Number(product.weight_lbs);
                const unitPrice = best && Number.isFinite(weight) && weight > 0 ? best.price / weight : null;

                return { product, offers, best, unitPrice };
            })
            .sort((a, b) => (a.unitPrice ?? Infinity) - (b.unitPrice ?? Infinity));
    }, [products, search, brand, pet, isAutoship]);

    const totalPages = Math.ceil(rows.length / ROWS_PER_PAGE);
    const currentPage = Math.min(page, Math.max(1, totalPages));
    const start = (currentPage - 1) * ROWS_PER_PAGE;
    const visibleRows = rows.slice(start, start + ROWS_PER_PAGE);
    const pageButtonClass = 'rounded-lg border border-gray-300 px-3 py-2 font-medium hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50';

    const filterClass = 'h-12 min-w-0 rounded-lg border border-gray-300 bg-white px-3 text-base outline-none focus-visible:ring-2 focus-visible:ring-emerald-700';
    return (
        <section aria-labelledby="price-table-title" className="mx-auto max-w-[1324px] px-4 pb-8 pt-5 text-gray-950 sm:px-8">
            <header className="mb-7 flex flex-wrap items-center justify-between gap-4 sm:mb-9">
                <Link href="/" className="flex items-center gap-3 text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
                    <svg aria-hidden="true" viewBox="0 0 64 64" className="h-12 w-12 shrink-0 fill-[#126b47] sm:h-14 sm:w-14">
                        <ellipse cx="11" cy="28" rx="6" ry="9" transform="rotate(-25 11 28)" />
                        <ellipse cx="23" cy="14" rx="7" ry="10" transform="rotate(-14 23 14)" />
                        <ellipse cx="41" cy="14" rx="7" ry="10" transform="rotate(14 41 14)" />
                        <ellipse cx="53" cy="28" rx="6" ry="9" transform="rotate(25 53 28)" />
                        <path fillRule="evenodd" d="M32 25c-9 0-21 15-21 24 0 7 6 10 12 8 4-1 6-3 9-3s5 2 9 3c6 2 12-1 12-8 0-9-12-24-21-24Zm0 24-7-7a4.5 4.5 0 0 1 7-5 4.5 4.5 0 0 1 7 5l-7 7Z" />
                    </svg>
                    <span>KibblePer<span className="text-[#126b47]">Pound</span></span>
                </Link>
                <nav aria-label="Main navigation" className="flex flex-wrap items-center gap-x-7 gap-y-2 text-lg sm:text-xl">
                    <button type="button" aria-pressed={pet === 'dog'} onClick={() => { setPet('dog'); setPage(1); }} className="hover:text-[#126b47] aria-pressed:font-semibold">Dog Food</button>
                    <button type="button" aria-pressed={pet === 'cat'} onClick={() => { setPet('cat'); setPage(1); }} className="hover:text-[#126b47] aria-pressed:font-semibold">Cat Food</button>
                    <a href="#price-table-brand" className="hover:text-[#126b47]">Brands</a>
                    <a href="#affiliate-disclosure" className="hover:text-[#126b47]">About</a>
                </nav>
            </header>

            <h1 id="price-table-title" className="text-3xl font-bold tracking-tight text-slate-900 lg:text-[40px] lg:leading-tight">
                Compare True Pet Food Prices Per Pound Across 6 Top Stores
            </h1>
            <p id="affiliate-disclosure" className="mt-1 text-base sm:text-lg">
                *Affiliate disclosure: As an affiliate, we earn from qualifying purchases at no extra cost to you.
            </p>

            <div className="mb-5 mt-5 grid grid-cols-1 items-center gap-2.5 sm:grid-cols-2 xl:grid-cols-[1.8fr_1fr_1fr_auto]">
                <label className="relative block">
                    <span className="sr-only">Search brand or formula</span>
                    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="pointer-events-none absolute left-3 top-3.5 h-5 w-5 text-gray-500">
                        <circle cx="10.5" cy="10.5" r="6.5" />
                        <path d="m16 16 5 5" />
                    </svg>
                    <input type="search" placeholder="Search brand or formula..." value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} className={`${filterClass} w-full pl-10`} />
                </label>
                <select id="price-table-brand" aria-label="Brand" value={brand} onChange={(event) => { setBrand(event.target.value); setPage(1); }} className={filterClass}>
                    <option value="">Brand: All</option>
                    {brands.map((value) => <option key={value} value={value}>Brand: {value}</option>)}
                </select>
                <select aria-label="Pet" value={pet} onChange={(event) => { setPet(event.target.value); setPage(1); }} className={filterClass}>
                    <option value="">Pet: All</option>
                    {[...new Set([...pets, 'dog', 'cat'])].sort().map((value) => (
                        <option key={value} value={value}>Pet: {value.charAt(0).toUpperCase() + value.slice(1)}</option>
                    ))}
                </select>
                <button type="button" role="switch" aria-checked={isAutoship} onClick={() => { setIsAutoship(!isAutoship); setPage(1); }} className="flex min-h-12 items-center gap-2.5 rounded-lg px-2 text-left text-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-700">
                    <span aria-hidden="true" className={`relative h-8 w-[58px] shrink-0 rounded-full transition-colors ${isAutoship ? 'bg-[#126b47]' : 'bg-gray-500'}`}>
                        <span className={`absolute left-1 top-1 h-6 w-6 rounded-full bg-white shadow-sm transition-transform ${isAutoship ? 'translate-x-[26px]' : ''}`} />
                    </span>
                    First-Time Auto-Ship
                </button>
            </div>

            <div role="region" aria-label="Store price comparison" tabIndex={0} className="overflow-x-auto rounded-xl border border-gray-300 bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-700">
                <table className="w-full min-w-[1020px] border-collapse text-left">
                    <thead className="bg-gray-100 text-lg">
                        <tr className="border-b border-gray-300">
                            <th scope="col" className="w-[25%] min-w-[245px] border-r border-gray-300 px-3 py-2.5">Product</th>
                            <th scope="col" className={cell}>Weight</th>
                            {STORES.map((store) => <th scope="col" key={store} className={cell}>{store}</th>)}
                            <th scope="col" className="whitespace-nowrap px-3 py-2.5 text-center">Best $/lb</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-300">
                        {visibleRows.map(({ product, offers, best, unitPrice }) => (
                            <tr key={product.id} className="hover:bg-gray-50">
                                <th scope="row" className="border-r border-gray-300 px-3 py-3 text-left font-normal">
                                    <div className="flex items-center gap-3">
                                        <div className="grid h-20 w-[65px] shrink-0 place-items-center">
                                            <ProductThumbnail key={product.image_url} imageUrl={product.image_url} />
                                        </div>
                                        <div>
                                            <div className="text-xl font-bold leading-tight">{product.brand}</div>
                                            <div className="text-base leading-snug">{product.name}</div>
                                        </div>
                                    </div>
                                </th>
                                <td className={`${cell} text-xl`}>{product.weight_lbs > 0 ? `${product.weight_lbs} lb` : '—'}</td>
                                {offers.map((offer, index) => (
                                    <td key={STORES[index]} className={cell}>
                                        {offer ? (
                                            <div className="flex flex-col items-center gap-1">
                                                <a href={getStoreSearchUrl(STORES[index]!, product, offer.affiliate_url)
                                                } target="_blank" rel="sponsored noopener noreferrer" className={`text-xl tabular-nums hover:underline ${offer === best ? 'font-extrabold text-[#126b47]' : ''}`}>
                                                    {money.format(offer.price)}
                                                </a>
                                                {offer === best && <span className="rounded-full bg-[#cce8d9] px-2.5 py-0.5 text-sm text-[#103a2a]">Lowest</span>}
                                                {isAutoship && !offer.usesAutoship && <span className="text-xs text-gray-600">One-time</span>}
                                            </div>
                                        ) : <span aria-label="No offer" className="text-gray-500">—</span>}
                                    </td>
                                ))}
                                <td className="whitespace-nowrap px-3 py-3 text-center">
                                    {best && unitPrice !== null ? (
                                        <a href={getStoreSearchUrl(STORES[offers.indexOf(best)]!, product, best.affiliate_url)} target="_blank" rel="sponsored noopener noreferrer" className="inline-flex items-center gap-1 rounded-full bg-[#126b47] px-3 py-2 text-base font-semibold text-white hover:bg-[#0d5338]">
                                            {money.format(unitPrice)}/lb <span aria-hidden="true">→</span>
                                        </a>
                                    ) : <span aria-label="Unit price unavailable" className="text-gray-500">—</span>}
                                </td>
                            </tr>
                        ))}
                        {rows.length === 0 && (
                            <tr><td colSpan={STORES.length + 3} className="px-4 py-12 text-center text-gray-600">No products match your filters.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
            {totalPages > 1 && (
                <nav aria-label="Product pagination" className="mt-4 flex flex-wrap items-center justify-between gap-3">
                    <p role="status" className="text-sm text-gray-700">
                        Showing {start + 1}–{start + visibleRows.length} of {rows.length} products
                    </p>
                    <div className="flex items-center gap-3">
                        <button type="button" className={pageButtonClass} disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)}>
                            Previous
                        </button>
                        <span className="text-sm">Page {currentPage} of {totalPages}</span>
                        <button type="button" className={pageButtonClass} disabled={currentPage === totalPages} onClick={() => setPage(currentPage + 1)}>
                            Next
                        </button>
                    </div>
                </nav>
            )}
        </section>
    );
}
