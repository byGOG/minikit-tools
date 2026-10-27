# MiniKit ortak iş listesi

Koordinatör her turda bu listedeki somut işlerden bağımsız olanları ajanlara dağıtır. Durumlar: hazırlanıyor → doğrulanıyor → tamamlandı. Yeni işin tetikleyicisi ve kabul ölçütü yazılır; yalnız varsayıma dayalı işler açık olarak tutulmaz.

| İş | Sahip | Kapsam ve kabul ölçütü | Durum |
|---|---|---|---|
| TEAM-001 | Koordinatör | Üç geçerli TOML rolü, proje concurrency sınırı, dosya sahipliği ve çalışma döngüsü | Tamamlandı |
| DEV-001 | Geliştirme | QR girdisi değişince bekleyen eski üretim sonucu gösterilmez; sonraki üretim doğru indirilir | Tamamlandı |
| CONTENT-001 | SEO/içerik | Büyük harf örneği 50 dilde gerçek fonksiyonla eşleşir; JSON karşılaştırma örneği gerçek JSON Pointer çıktısını gösterir | Tamamlandı |
| CONTENT-002 | SEO/içerik | Üç JSON/YAML rehberinde mevcut çevrilmiş girdi/sayı sınırları 50 dilde görünür | Tamamlandı |
| QA-001 | Kalite/güvenlik | Aynı PR güncellemeleri birbirini iptal eder; PR ve main yayın grupları farklıdır | Tamamlandı |
| QA-002 | Kalite/güvenlik | Markdown önizlemesi dış kaynak isteği/çalıştırılabilir HTML taşımaz; iframe sandbox ve CSP testi iki motorda geçer | Tamamlandı |

## Rol genişletme — 27 Ekim 2026

| İş | Sahip | Kabul ölçütü | Durum |
|---|---|---|---|
| TEAM-002 | Koordinatör | Yeni araç geliştirici ve ürün araştırma/UX/analitik rolleri tanımlı; yedi profil geçerli; aynı anda üç uzman sınırı korunuyor | Tamamlandı |

Yeni araç geliştirme işine başlarken katalogda bulunmayan adaylar ürün araştırmasıyla değerlendirilir. Kullanıcı seçimi ekibe bıraktığında koordinatör uygun adayı seçip geliştirici, içerik ve kalite işlerini tamamlatır.

## Sonraki tur adayları

- GitHub’daki mevcut Dependabot bağımlılık/Actions güncelleme önerilerini uyumluluk açısından incelemek; ana sürüm geçişlerini test etmeden birleştirmemek.
- Kullanıcı yeni hedef verdiğinde somut işler eklenecek. Henüz doğrulanmamış büyüme veya gelir varsayımları otomatik geliştirme işi değildir.
- Zamanlanmış çalışma sıklığı kullanıcı tercihine göre ayrıca belirlenir; bu dosya bir zamanlayıcı değildir.

## İlk turun doğrulaması

108 birim testi, 53 dil/SEO testi ve 192 Chromium/WebKit testi geçti (toplam 353). Üç TOML rolü ve concurrency ayarı parse edilerek doğrulandı. PR/main concurrency anahtarlarının ayrıldığı ayrıca kontrol edildi. Astro check: sıfır hata, uyarı ve ipucu. İlk yerel geniş tarayıcı turu zaman aşımına uğramıştı; odaklı dört test ve sonraki tam 192 testlik tur başarılı tamamlandı.

Koordinatörün PR/CI ve canlı yayın doğrulaması sonuç raporunda saklanır.

Rol genişletmesi: yedi TOML profilinin zorunlu alanları, benzersiz adları, dosya/rol adı eşleşmesi, doküman bağlantıları ve üç uzman sınırı doğrulandı. Geliştirme, içerik ve kalite ajanları rol sınırlarını salt okunur olarak inceledi; gerekli bir düzeltme bulmadı. Bu tur uygulama kodunu veya araç kataloğunu değiştirmez.

## Yeni araç turu — 27 Ekim 2026

| İş | Sahip | Kabul ölçütü | Durum |
|---|---|---|---|
| TOOL-001 | Yeni araç geliştirici + içerik + kalite | Dosya SHA-256: en fazla 50 MiB, boş/ikili dosya, isteğe bağlı 64 HEX özet, eski işlem sonucunu geçersiz kılma; 50 dil ve rehber. 113 birim + 53 dil + 204 tarayıcı testi geçti. | Tamamlandı; PR #40 birleştirildi, canlıda 10 tarayıcı kontrolü geçti |

Ürün araştırması dosya SHA-256 doğrulayıcıyı seçti. Mevcut SHA aracı yalnız UTF-8 metin işler; yeni araç dosyanın özgün baytları için ayrı kullanım sağlar. Trafik/gelir üstünlüğü iddiası yok.

## Lorem Ipsum turu — 27 Ekim 2026

| İş | Sahip | Kabul ölçütü | Durum |
|---|---|---|---|
| TOOL-002 | Yeni araç geliştirici + içerik + kalite | Lorem Ipsum: 1–50 paragraf × 5–200 kelime, en fazla 10.000 kelime; tam sayım, girdi doğrulama, 50 dil, rehber, bağımsız testler ve canlı kontrol | Tamamlandı; PR #41 birleştirildi. 118 birim + 53 dil + 214 tarayıcı testi ve canlıda 8 kontrol geçti. |

## Roma rakamları turu — 27 Ekim 2026

| İş | Sahip | Kabul ölçütü | Durum |
|---|---|---|---|
| TOOL-003 | Yeni araç geliştirici + içerik + kalite | 1–3999 ↔ standart Roma rakamları, 100 karakter sınırı, geçersiz biçimleri reddetme, 50 dil, rehber, bağımsız test ve canlı kontrol | Tamamlandı; PR #42 birleştirildi. 124 birim + 53 dil + 226 tarayıcı testi ve canlıda 10 kontrol geçti. |

## Mors kodu turu — 27 Ekim 2026

| İş | Sahip | Kabul ölçütü | Durum |
|---|---|---|---|
| TOOL-004 | Yeni araç geliştirici + içerik + kalite | A–Z/0–9 iki yönlü Mors, ham 1000/6000 karakter sınırı, boş kelime ve bilinmeyen kodu reddetme, 50 dil, rehber, bağımsız test ve canlı kontrol | Kod, 130 birim ve 53 dil testi tamam; yeni Mors tarayıcı kontrolleri geçti. Tam Linux CI ve canlı yayın kanıtı sonuç raporunda. |
