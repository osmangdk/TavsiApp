export type Language = 'tr' | 'en';

export const TRANSLATIONS = {
  tr: {
    // Header & Navigation
    explore: 'Keşfet',
    network: 'Ağım',
    add: 'Ekle',
    profile: 'Profil',
    home: 'Ana Sayfa',

    // App Settings
    app_settings_title: 'Uygulama & Görünüm Ayarları',
    notification_preferences: 'Bildirim Tercihleri',
    notification_desc: 'Ağınızdaki kişilerden gelen yeni bağlantı isteklerini ve tavsiyeleri cihazınızda anlık bildirim olarak alın.',
    instant_notifications: 'Anlık Sistem Bildirimleri',
    notif_active_desc: 'Aktif — Tavsi arka plandayken cep telefonunuza/ekranınıza bildirim düşer.',
    notif_denied_desc: 'Tarayıcı izinleri engellendi. Ayarlardan bildirim izni verin.',
    notif_off_desc: 'Kapalı — Yeni ağ isteklerinde anlık bildirim almak için dokunup izin verin.',

    appearance_mode: 'Görünüm Modu (Tema)',
    appearance_desc: 'Uygulamanın açık, karanlık veya sistem ayarlarınıza uyumlu görünümünü seçin.',
    system_default: 'Sistem Ayarlarını Kullan',
    system_default_desc: 'Cihazınızın sistem temasını (Açık / Karanlık) otomatik uygular.',
    light_mode: 'Açık Mod',
    light_mode_desc: 'Ferah beyaz arka plan ve net koyu fontlar.',
    dark_mode: 'Karanlık Mod (Dark Mode)',
    dark_mode_desc: 'Göz yormayan şık koyu tema. Tüm yazılar parlak beyaz görünür.',

    app_language: 'Uygulama Dili / Language',
    app_language_desc: 'Uygulamanın varsayılan dilini belirleyin.',

    theme_preview: 'Tema Önizlemesi',
    theme_preview_active_dark: '🌙 Karanlık Mod Aktif',
    theme_preview_active_light: '☀️ Açık Mod Aktif',
    theme_preview_title: 'Tavsi Rehberi',
    theme_preview_desc: 'Güvendiğiniz kişilerin mekan tavsiyeleri burada sorunsuz görüntülenir.',

    // Search Screen
    search_placeholder: 'Mekan veya uzman arayın...',
    list_view: 'Liste',
    map_view: 'Harita',
    filter_all: 'Tümü',
    filter_trusted: 'Sadece Güvendiklerim',
    filter_nearby: 'Yakınımda',
    results: 'Sonuçlar',
    categories: 'Kategoriler',
    popular_searches: 'Popüler Aramalar',
    search_this_area: 'Bu Bölgede Ara',
    searching: 'Aranıyor...',
    no_results: 'Sonuç bulunamadı.',

    // Profile Screen
    edit_profile: 'Profili Düzenle',
    trusted_count: 'Güvendiği',
    followers_count: 'Güvenenler',
    recommendations_count: 'Tercih',
    your_recommendations: 'Tavsiyeleriniz',
    no_recommendations_yet: 'Henüz mekan eklemediniz.',
    invite_friends: 'Arkadaşlarını Davet Et',
    invite_desc: 'Tavsi ağı sadece davetle büyür. Güvendiğiniz kişileri ağınıza katmak için bu kodu paylaşın.',
    invite_code_label: 'Davetiye Kodunuz',
    remaining_uses: 'Kalan Hakkınız',
    copy: 'Kopyala',
    copied: 'Kopyalandı!',
    share: 'Paylaş',
    settings_and_privacy: 'Ayarlar & Gizlilik',
    settings_privacy_sub: 'Hesap gizliliği, izinler ve oturum kapatma',
    app_theme_settings: 'Uygulama & Görünüm Ayarları',
    app_theme_sub: 'Karanlık mod (Dark mode) ve dil tercihleri',

    // Edit Profile Screen
    full_name: 'Ad Soyad',
    username: 'Kullanıcı Adı',
    bio: 'Biyografi / Hakkımda',
    bio_placeholder: 'Tavsi ağındakiler için kendinizden bahsedin...',
    save: 'Kaydet',

    // Categories
    cat_food_drink: 'Yeme & İçme',
    cat_health: 'Sağlık',
    cat_care: 'Kişisel Bakım',
    cat_activity: 'Aktivite',
    cat_services: 'Hizmetler',
  },
  en: {
    // Header & Navigation
    explore: 'Explore',
    network: 'My Network',
    add: 'Add',
    profile: 'Profile',
    home: 'Home',

    // App Settings
    app_settings_title: 'App & Theme Settings',
    notification_preferences: 'Notification Preferences',
    notification_desc: 'Receive instant push notifications on your device when trusted peers send connection requests or recommendations.',
    instant_notifications: 'Instant Push Notifications',
    notif_active_desc: 'Active — Notifications are pushed when Tavsi is in the background.',
    notif_denied_desc: 'Browser permission blocked. Allow notifications in browser settings.',
    notif_off_desc: 'Disabled — Tap to enable push notifications for new network requests.',

    appearance_mode: 'Appearance Mode (Theme)',
    appearance_desc: 'Choose light, dark, or system default theme appearance.',
    system_default: 'Use System Settings',
    system_default_desc: 'Automatically adapts to your device system theme (Light / Dark).',
    light_mode: 'Light Mode',
    light_mode_desc: 'Clean white background with crisp dark fonts.',
    dark_mode: 'Dark Mode (Karanlık Mod)',
    dark_mode_desc: 'Sleek dark theme. All text elements appear in crisp white.',

    app_language: 'App Language',
    app_language_desc: 'Choose your default application language.',

    theme_preview: 'Theme Preview',
    theme_preview_active_dark: '🌙 Dark Mode Active',
    theme_preview_active_light: '☀️ Light Mode Active',
    theme_preview_title: 'Tavsi Guide',
    theme_preview_desc: 'Recommendations from your trusted network will display seamlessly here.',

    // Search Screen
    search_placeholder: 'Search places or experts...',
    list_view: 'List',
    map_view: 'Map',
    filter_all: 'All',
    filter_trusted: 'Trusted Only',
    filter_nearby: 'Nearby',
    results: 'Results',
    categories: 'Categories',
    popular_searches: 'Popular Searches',
    search_this_area: 'Search This Area',
    searching: 'Searching...',
    no_results: 'No results found.',

    // Profile Screen
    edit_profile: 'Edit Profile',
    trusted_count: 'Trusted',
    followers_count: 'Trusting You',
    recommendations_count: 'Recommendations',
    your_recommendations: 'Your Recommendations',
    no_recommendations_yet: "You haven't added any places yet.",
    invite_friends: 'Invite Friends',
    invite_desc: 'Tavsi grows exclusively by invitation. Share this code to add people you trust.',
    invite_code_label: 'Your Invite Code',
    remaining_uses: 'Remaining Uses',
    copy: 'Copy',
    copied: 'Copied!',
    share: 'Share',
    settings_and_privacy: 'Settings & Privacy',
    settings_privacy_sub: 'Account privacy, permissions and sign out',
    app_theme_settings: 'App & Theme Settings',
    app_theme_sub: 'Dark mode and language preferences',

    // Edit Profile Screen
    full_name: 'Full Name',
    username: 'Username',
    bio: 'Bio / About',
    bio_placeholder: 'Tell your network a bit about yourself...',
    save: 'Save',

    // Categories
    cat_food_drink: 'Food & Drink',
    cat_health: 'Health',
    cat_care: 'Personal Care',
    cat_activity: 'Activities',
    cat_services: 'Services',
  }
};

export type TranslationKey = keyof typeof TRANSLATIONS.tr;

export function getTranslation(key: TranslationKey, lang: Language = 'tr'): string {
  const dict = TRANSLATIONS[lang] || TRANSLATIONS.tr;
  return dict[key] || TRANSLATIONS.tr[key] || key;
}
