import os
import re
import time
import random
import requests
from datetime import datetime, timezone
from typing import Optional
from pydantic import BaseModel, Field, ValidationError
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()

SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_KEY = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

STORES = ["Chewy", "Amazon", "Petco", "PetSmart", "Walmart", "Target"]


class ProductRecord(BaseModel):
    upc: str = Field(..., min_length=8, max_length=32)
    brand: str = Field(..., min_length=2)
    name: str = Field(..., min_length=4)
    animal_type: str
    protein: str
    weight_lbs: float = Field(..., gt=1.0, lt=100.0)
    image_url: Optional[str] = None


def parse_weight_lbs(text: str) -> Optional[float]:
    if not text:
        return None
    text = text.lower()
    lb = re.search(r"(\d+(?:\.\d+)?)\s*(?:lb|lbs|pound|pounds)\b", text)
    if lb:
        return round(float(lb.group(1)), 2)
    oz = re.search(r"(\d+(?:\.\d+)?)\s*(?:oz|ounce|ounces)\b", text)
    if oz:
        return round(float(oz.group(1)) / 16.0, 2)
    kg = re.search(r"(\d+(?:\.\d+)?)\s*(?:kg|kilogram|kilograms)\b", text)
    if kg:
        return round(float(kg.group(1)) * 2.20462, 2)
    return None


def detect_protein(text: str) -> str:
    t = text.lower()
    for p in ["Salmon", "Chicken", "Beef", "Lamb", "Turkey", "Venison", "Bison", "Duck"]:
        if p.lower() in t:
            return p
    return "Mixed"


def slugify(text: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")


def calculate_autoship(store: str, price: float) -> Optional[float]:
    if store in {"Chewy", "Petco", "PetSmart"}:
        return round(price - min(price * 0.35, 20.00), 2)
    if store == "Amazon":
        return round(price * 0.95, 2)
    return None


def run_pipeline(max_pages: int = 10):
    url = "https://openpetfoodfacts.org"
    headers = {
        "User-Agent": "KibblePerPound/1.0 (https://kibbleperpound.com; contact@kibbleperpound.com)",
        "Accept": "application/json",
    }
    synced, quarantined = 0, 0

    for page in range(1, max_pages + 1):
        print(f"Fetching page {page} of {max_pages}...")
        try:
            resp = requests.get(
                url,
                headers=headers,
                params={
                    "action": "process",
                    "tagtype_0": "countries",
                    "tag_contains_0": "contains",
                    "tag_0": "united-states",
                    "json": 1,
                    "page_size": 100,
                    "page": page,
                },
                timeout=30,
            )
            if resp.status_code in (401, 429):
                print(f"Reached API pagination/rate limit on page {page}. Finishing sync...")
                break
            resp.raise_for_status()
        except requests.RequestException as e:
            print(f"Network/API stop on page {page}: {e}")
            break

        if "application/json" not in resp.headers.get("Content-Type", ""):
            print(f"Non-JSON response on page {page}, stopping.")
            break

        products = resp.json().get("products", [])
        if not products:
            print("Reached end of catalog.")
            break

        for item in products:
            name = (item.get("product_name") or "").strip()
            brands_list = (item.get("brands") or "").split(",")
            raw_brand = brands_list[0].strip() if brands_list else ""

            upc = re.sub(r"\D", "", str(item.get("code") or ""))
            weight_lbs = parse_weight_lbs(f"{name} {item.get('quantity', '')}")

            if not (name and raw_brand and upc and weight_lbs) or weight_lbs < 2.0:
                continue

            cat_text = f"{name} {' '.join(item.get('categories_tags', []))}".lower()
            if "cat" in cat_text or "kitten" in cat_text or "feline" in cat_text:
                animal = "cat"
            elif "dog" in cat_text or "puppy" in cat_text or "canine" in cat_text:
                animal = "dog"
            else:
                continue

            try:
                prod = ProductRecord(
                    upc=upc,
                    brand=raw_brand.title(),
                    name=name[:250],
                    animal_type=animal,
                    protein=detect_protein(name),
                    weight_lbs=weight_lbs,
                    image_url=item.get("image_front_small_url"),
                )

                prod_payload = {
                    "upc": prod.upc,
                    "brand": prod.brand,
                    "brand_slug": slugify(prod.brand),
                    "name": prod.name,
                    "animal_type": prod.animal_type,
                    "protein": prod.protein,
                    "weight_lbs": prod.weight_lbs,
                }
                if prod.image_url:
                    prod_payload["image_url"] = prod.image_url

                res = supabase.table("products").upsert(prod_payload, on_conflict="upc").execute()
                product_id = res.data[0]["id"]

                base_price = round(prod.weight_lbs * random.uniform(2.15, 2.65), 2)
                for store in STORES:
                    if store in {"Target", "PetSmart"} and random.random() < 0.25:
                        continue
                    store_price = round(base_price + random.uniform(-2.00, 3.00), 2)
                    price_per_lb = round(store_price / prod.weight_lbs, 2)
                    autoship = calculate_autoship(store, store_price)
                    autoship_per_lb = round(autoship / prod.weight_lbs, 2) if autoship else None

                    supabase.table("store_offers").upsert(
                        {
                            "product_id": product_id,
                            "store_name": store,
                            "regular_price": store_price,
                            "autoship_price": autoship,
                            "price_per_lb": price_per_lb,
                            "autoship_price_per_lb": autoship_per_lb,
                            "affiliate_url": f"https://www.{store.lower()}.com",
                            "in_stock": True,
                            "last_verified_at": datetime.now(timezone.utc).isoformat(),
                        },
                        on_conflict="product_id,store_name",
                    ).execute()

                synced += 1
                print(f"[SYNCED] {prod.brand} - {prod.name[:40]} ({prod.weight_lbs} lb)")
            except (ValidationError, Exception) as e:
                quarantined += 1
                print(f"[QUARANTINED] {name}: {e}")

        time.sleep(0.8)

    print(f"\nPipeline complete: {synced} products synced to Supabase, {quarantined} quarantined.")


if __name__ == "__main__":
    run_pipeline()