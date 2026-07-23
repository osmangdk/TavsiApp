import os
import sys

# Windows işletim sisteminde PyOsmium'un ihtiyaç duyduğu DLL'lerin (expat.dll, libbz2 vb.)
# yüklenebilmesi için sistemdeki yaygın DLL yollarını arama dizinine ekliyoruz.
if sys.platform == 'win32':
    possible_dll_paths = [
        r"C:\Program Files\PostgreSQL\17\bin",
        r"C:\Program Files\PostgreSQL\16\bin",
        r"C:\Program Files\PostgreSQL\15\bin",
        r"C:\Program Files\Git\bin",
        r"C:\Program Files\Git\mingw64\bin",
    ]
    for path in possible_dll_paths:
        if os.path.exists(path):
            try:
                os.add_dll_directory(path)
            except Exception:
                pass

import osmium
import json

class TavsiPOIExtractor(osmium.SimpleHandler):
    def __init__(self):
        super().__init__()
        self.places = []

    def node(self, n):
        if not n.tags:
            return
        
        category = None
        
        # 1. Yeme & İçme
        if 'amenity' in n.tags:
            amenity = n.tags['amenity']
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
        if 'shop' in n.tags:
            shop = n.tags['shop']
            if shop in ['hairdresser', 'beauty']:
                category = 'Kişisel Bakım'
            elif shop in ['car_repair', 'dry_cleaning']:
                category = 'Hizmet & Usta'
            elif shop == 'estate_agent':
                category = 'Gayrimenkul'
                
        # 6. Hizmet & Usta (Zanaatkarlar)
        if 'craft' in n.tags:
            craft = n.tags['craft']
            if craft in ['plumber', 'electrician', 'tailor', 'carpenter']:
                category = 'Hizmet & Usta'
                
        # 7. Aktivite & Spor
        if 'leisure' in n.tags:
            leisure = n.tags['leisure']
            if leisure in ['sports_centre', 'pitch', 'fitness_centre']:
                category = 'Aktivite & Spor'
                
        # 8. Hukuk / Gayrimenkul Ofisleri
        if 'office' in n.tags:
            office = n.tags['office']
            if office == 'lawyer':
                category = 'Hukuk'
            elif office == 'estate_agent':
                category = 'Gayrimenkul'

        # Eğer eşleşen bir kategori bulunduysa listeye ekle
        if category:
            name = n.tags.get('name', '')
            if not name: # İsmi olmayan yerleri atla
                return
                
            city = n.tags.get('addr:city', '')
            district = n.tags.get('addr:suburb', n.tags.get('addr:district', ''))
            
            # Enlem/Boylam kontrolü
            try:
                lat = n.location.lat
                lon = n.location.lon
            except osmium.InvalidLocationError:
                return # Koordinatı geçersizse atla
            
            self.places.append({
                "osm_id": f"node_{n.id}",
                "name": name,
                "category": category, # Tavsi ana kategorisi
                "city": city,
                "district": district,
                "latitude": lat,
                "longitude": lon
            })

def main():
    if len(sys.argv) < 2:
        print("Kullanım: python extract_osm.py <dosya_yolu.osm.pbf>")
        sys.exit(1)
        
    pbf_file = sys.argv[1]
    print(f"'{pbf_file}' dosyası taranıyor, bu işlem dosya boyutuna bağlı olarak birkaç dakika sürebilir...")
    
    extractor = TavsiPOIExtractor()
    try:
        # locations=True enlem ve boylamı almak için şarttır
        extractor.apply_file(pbf_file, locations=True)
    except Exception as e:
        print(f"Hata oluştu: {e}")
        print("Not: Enlem/boylam bilgilerini okumak için 'locations=True' gereklidir.")
        print("Eğer hata kütüphane kaynaklıysa lütfen python osmium kütüphanesinin doğru kurulduğundan emin olun.")
        sys.exit(1)

    output_file = "filtered_places.json"
    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(extractor.places, f, ensure_ascii=False, indent=2)

    print(f"Ayıklama tamamlandı! Toplam {len(extractor.places)} mekan '{output_file}' dosyasına kaydedildi.")

if __name__ == "__main__":
    main()
