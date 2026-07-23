import sqlite3
import json
import sys
import struct
import re
import os

# GeoPackage Point Geometrisinden koordinatları çözmek için yardımcı fonksiyon
def parse_gpkg_point(blob):
    if not blob or len(blob) < 8:
        return None, None
    
    # GeoPackage binary header kontrolü
    magic = blob[0:2]
    if magic != b'GP':
        return None, None
        
    flags = blob[3]
    
    # Endianness (Byte sırası)
    header_byte_order = '<' if (flags & 1) else '>'
    
    # Zarf (envelope) boyutu
    envelope_type = (flags >> 1) & 7
    envelope_sizes = {0: 0, 1: 32, 2: 48, 3: 48, 4: 64}
    envelope_size = envelope_sizes.get(envelope_type, 0)
    
    wkb_start = 8 + envelope_size
    wkb = blob[wkb_start:]
    
    if len(wkb) < 21:
        return None, None
        
    wkb_byte_order_flag = wkb[0]
    wkb_byte_order = '<' if wkb_byte_order_flag == 1 else '>'
    
    geom_type = struct.unpack(f"{wkb_byte_order}I", wkb[1:5])[0]
    if geom_type != 1: # Point tipi 1'dir
        return None, None
        
    x, y = struct.unpack(f"{wkb_byte_order}dd", wkb[5:21])
    return x, y # x = longitude (boylam), y = latitude (enlem)

# "key"=>"value" formatındaki other_tags sütununu Python sözlüğüne çevirir
def parse_other_tags(other_tags_str):
    tags = {}
    if not other_tags_str:
        return tags
    pairs = re.findall(r'"([^"]+)"=>"([^"]*)"', other_tags_str)
    for k, v in pairs:
        tags[k] = v
    return tags

def main():
    if len(sys.argv) < 2:
        print("Kullanım: python extract_osm_gpkg.py <dosya_yolu.osm.geopackage>")
        sys.exit(1)
        
    gpkg_file = sys.argv[1]
    if not os.path.exists(gpkg_file):
        print(f"Hata: '{gpkg_file}' dosyası bulunamadı.")
        sys.exit(1)
        
    print(f"GeoPackage dosyasına bağlanılıyor: {gpkg_file}")
    conn = sqlite3.connect(gpkg_file)
    cursor = conn.cursor()
    
    # 1. Tabloları kontrol edelim
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
    tables = [t[0] for t in cursor.fetchall()]
    
    # Genelde OSM GPKG aktarımlarında 'points' tablosu olur
    point_table = None
    for t in ['points', 'poi_point', 'osm_points', 'point']:
        if t in tables:
            point_table = t
            break
            
    if not point_table:
        print(f"Hata: GeoPackage içinde nokta tablosu bulunamadı. Mevcut tablolar: {tables}")
        conn.close()
        sys.exit(1)
        
    print(f"Nokta verileri '{point_table}' tablosundan okunacak.")
    
    # 2. Kolonları sorgulayalım ve dinamik select hazırlayalım
    cursor.execute(f"PRAGMA table_info({point_table})")
    columns = [col[1] for col in cursor.fetchall()]
    
    geom_col = 'geom' if 'geom' in columns else ('geometry' if 'geometry' in columns else None)
    if not geom_col:
        print("Hata: Geometri kolonu bulunamadı.")
        conn.close()
        sys.exit(1)
        
    select_cols = ["osm_id", "name", geom_col]
    
    # Tavsi'nin arayacağı anahtar kelimeleri içeren kolonlar
    tag_cols = ["amenity", "shop", "office", "leisure", "craft", "addr:city", "addr:suburb", "addr:district"]
    existing_tag_cols = [c for c in tag_cols if c in columns]
    
    query_cols = select_cols + existing_tag_cols
    has_other_tags = "other_tags" in columns
    if has_other_tags:
        query_cols.append("other_tags")
        
    query = f"SELECT {', '.join(query_cols)} FROM {point_table}"
    print(f"Sorgu çalıştırılıyor: {query}")
    
    cursor.execute(query)
    
    places = []
    
    # Sonuçları işle
    row_count = 0
    match_count = 0
    
    while True:
        rows = cursor.fetchmany(50000) # Belleği şişirmemek için 50binlik paketler halinde çekelim
        if not rows:
            break
            
        for row in rows:
            row_count += 1
            # Kolon değerlerini haritala
            row_data = dict(zip(query_cols, row))
            
            # Etiketleri birleştirelim
            tags = {}
            for col in existing_tag_cols:
                if row_data.get(col):
                    tags[col] = row_data[col]
                    
            if has_other_tags and row_data.get("other_tags"):
                extra_tags = parse_other_tags(row_data["other_tags"])
                tags.update(extra_tags)
                
            # Tavsi kategorilerini eşleştir
            category = None
            
            # 1. Yeme & İçme
            amenity = tags.get('amenity', '')
            if amenity in ['restaurant', 'cafe', 'fast_food', 'bar', 'pub', 'food_court']:
                category = 'Yeme & İçme'
            # 2. Sağlık & Medikal
            elif amenity in ['dentist', 'doctors', 'veterinary', 'clinic', 'hospital']:
                category = 'Sağlık & Medikal'
            # 3. Eğitim & Gelişim
            elif amenity in ['kindergarten', 'driving_school', 'language_school']:
                category = 'Eğitim & Gelişim'
            # 4. Hukuk (Noter)
            elif amenity == 'notary':
                category = 'Hukuk'
                
            # 5. Kişisel Bakım & Hizmet
            shop = tags.get('shop', '')
            if shop in ['hairdresser', 'beauty']:
                category = 'Kişisel Bakım'
            elif shop in ['car_repair', 'dry_cleaning']:
                category = 'Hizmet & Usta'
            elif shop == 'estate_agent':
                category = 'Gayrimenkul'
                
            # 6. Hizmet & Usta (Zanaatkarlar)
            craft = tags.get('craft', '')
            if craft in ['plumber', 'electrician', 'tailor', 'carpenter']:
                category = 'Hizmet & Usta'
                
            # 7. Aktivite & Spor
            leisure = tags.get('leisure', '')
            if leisure in ['sports_centre', 'pitch', 'fitness_centre']:
                category = 'Aktivite & Spor'
                
            # 8. Hukuk / Gayrimenkul Ofisleri
            office = tags.get('office', '')
            if office == 'lawyer':
                category = 'Hukuk'
            elif office == 'estate_agent':
                category = 'Gayrimenkul'

            if category:
                name = row_data.get('name', '')
                if not name:
                    continue
                    
                geom_blob = row_data.get(geom_col)
                lon, lat = parse_gpkg_point(geom_blob)
                
                if lon is None or lat is None:
                    continue
                    
                city = tags.get('addr:city', '')
                district = tags.get('addr:suburb', tags.get('addr:district', ''))
                
                places.append({
                    "osm_id": str(row_data.get("osm_id", f"gpkg_{row_count}")),
                    "name": name,
                    "category": category,
                    "city": city,
                    "district": district,
                    "latitude": lat,
                    "longitude": lon
                })
                match_count += 1
                
        print(f"\rTaranan satır: {row_count}, Eşleşen mekan: {match_count}", end="")

    conn.close()
    
    # JSON Dosyasına Yaz
    output_file = "filtered_places.json"
    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(places, f, ensure_ascii=False, indent=2)
        
    print(f"\nİşlem tamamlandı! Toplam {match_count} mekan '{output_file}' dosyasına yazıldı.")

if __name__ == "__main__":
    main()
