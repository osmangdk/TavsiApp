import duckdb
import json
import os
import sys

# Tavsi Kategori Eşleştirme Sözlüğü
CATEGORY_MAPPING = {
    # 1. Yeme & İçme
    'restaurant': 'Yeme & İçme',
    'cafe': 'Yeme & İçme',
    'coffee_shop': 'Yeme & İçme',
    'bakery': 'Yeme & İçme',
    'fast_food_restaurant': 'Yeme & İçme',
    'bar': 'Yeme & İçme',
    'pub': 'Yeme & İçme',
    'food_court': 'Yeme & İçme',
    'pizzeria': 'Yeme & İçme',
    'diner': 'Yeme & İçme',

    # 2. Sağlık & Medikal
    'doctor': 'Sağlık & Medikal',
    'dentist': 'Sağlık & Medikal',
    'hospital': 'Sağlık & Medikal',
    'clinic': 'Sağlık & Medikal',
    'veterinarian': 'Sağlık & Medikal',
    'pharmacy': 'Sağlık & Medikal',
    'optician': 'Sağlık & Medikal',

    # 3. Kişisel Bakım
    'beauty_salon': 'Kişisel Bakım',
    'hair_salon': 'Kişisel Bakım',
    'barber_shop': 'Kişisel Bakım',
    'spa': 'Kişisel Bakım',
    'nail_salon': 'Kişisel Bakım',

    # 4. Hizmet & Usta
    'auto_repair': 'Hizmet & Usta',
    'dry_cleaner': 'Hizmet & Usta',
    'laundry': 'Hizmet & Usta',
    'tailor': 'Hizmet & Usta',
    'carpenter': 'Hizmet & Usta',
    'plumber': 'Hizmet & Usta',
    'electrician': 'Hizmet & Usta',

    # 5. Eğitim & Gelişim
    'school': 'Eğitim & Gelişim',
    'kindergarten': 'Eğitim & Gelişim',
    'language_school': 'Eğitim & Gelişim',
    'driving_school': 'Eğitim & Gelişim',

    # 6. Aktivite & Spor
    'gym': 'Aktivite & Spor',
    'sports_complex': 'Aktivite & Spor',
    'dance_school': 'Aktivite & Spor',
    'yoga_studio': 'Aktivite & Spor',

    # 7. Hukuk
    'lawyer': 'Hukuk',
    'law_firm': 'Hukuk',
    'notary': 'Hukuk',

    # 8. Gayrimenkul
    'real_estate_agency': 'Gayrimenkul',
    'real_estate_appraiser': 'Gayrimenkul'
}

def map_category(categories_struct):
    """
    Overture Maps kategorilerinden (primary veya alternate) Tavsi kategorisini bulur.
    """
    if not categories_struct:
        return 'Diğer'
    
    primary = categories_struct.get('primary')
    if primary and primary in CATEGORY_MAPPING:
        return CATEGORY_MAPPING[primary]
    
    alternate = categories_struct.get('alternate') or []
    for cat in alternate:
        if cat in CATEGORY_MAPPING:
            return CATEGORY_MAPPING[cat]
            
    return None # Eşleşmeyen kategorileri süzmek için None döndürüyoruz

def main():
    if sys.stdout.encoding.lower() != 'utf-8':
        sys.stdout.reconfigure(encoding='utf-8')
        
    print("=========================================================")
    print("Overture Maps Foundation - Turkiye POI Cekici")
    print("=========================================================")
    
    output_file = os.path.join(os.path.dirname(__file__), "..", "filtered_places.json")
    
    # Türkiye Sınırları Bounding Box (Enlem: 35.8 - 42.1, Boylam: 25.6 - 44.8)
    BBOX = {
        'xmin': 25.6,
        'xmax': 44.8,
        'ymin': 35.8,
        'ymax': 42.1
    }
    
    print("\n1. DuckDB bulut baglantisi baslatiliyor...")
    con = duckdb.connect()
    
    # Gerekli uzantilari yukleyelim
    con.execute("INSTALL spatial; LOAD spatial;")
    con.execute("INSTALL httpfs; LOAD httpfs;")
    con.execute("SET s3_region='us-west-2';")
    
    # Dynamic S3 Release resolution via Overture STAC Catalog
    try:
        latest_rel = con.execute("SELECT latest FROM 'https://stac.overturemaps.org/catalog.json'").fetchone()[0]
        print(f"Overture Maps En Guncel Surum Tespiti: {latest_rel}")
        parquet_path = f"s3://overturemaps-us-west-2/release/{latest_rel}/theme=places/type=place/*"
    except Exception as stac_err:
        print(f"STAC catalog okunamadi, varsayilan sürüme geciliyor... ({stac_err})")
        parquet_path = "s3://overturemaps-us-west-2/release/2026-07-22.0/theme=places/type=place/*"
    
    query = f"""
        SELECT 
            id as osm_id,
            names.primary as name,
            categories,
            addresses,
            ST_X(geometry) as longitude,
            ST_Y(geometry) as latitude
        FROM read_parquet('{parquet_path}', hive_partitioning=1)
        WHERE bbox.xmin >= {BBOX['xmin']} AND bbox.xmax <= {BBOX['xmax']}
          AND bbox.ymin >= {BBOX['ymin']} AND bbox.ymax <= {BBOX['ymax']}
          AND names.primary IS NOT NULL
    """
    
    try:
        print(f"Sorgu S3 depolara gonderiliyor...")
        results = con.execute(query).fetchall()
        print(f"\n3. Toplam {len(results)} ham POI verisi cekildi. Tavsi kategorilerine gore filtreleniyor...")

        
        places = []
        for r in results:
            osm_id, name, categories, addresses, lon, lat = r
            
            # Kategori donusumu
            tavsi_category = map_category(categories)
            if not tavsi_category:
                continue # Tavsi ana kategorilerine girmeyen yerleri atla
                
            city = ''
            district = ''
            
            if addresses and len(addresses) > 0:
                first_addr = addresses[0]
                city = first_addr.get('locality', '')
                district = first_addr.get('region', '')
                
            places.append({
                "osm_id": str(osm_id),
                "name": name,
                "category": tavsi_category,
                "city": city,
                "district": district,
                "latitude": lat,
                "longitude": lon
            })
            
        print(f"4. Filtreleme tamamlandi! Toplam {len(places)} adet kaliteli mekan kaydediliyor...")
        
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(places, f, ensure_ascii=False, indent=2)
            
        print(f"\n[BASARILI] Veriler '{output_file}' dosyasina yazildi!")
        print("Ipucu: Simdi 'node scripts/import_places.js' calistirarak Supabase'e yukleyebilirsiniz.")
        
    except Exception as e:
        print(f"\n[HATA] Hata olustu: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()

