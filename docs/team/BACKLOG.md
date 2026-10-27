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

## Sonraki tur adayları

- GitHub’daki mevcut Dependabot bağımlılık/Actions güncelleme önerilerini uyumluluk açısından incelemek; ana sürüm geçişlerini test etmeden birleştirmemek.
- Kullanıcı yeni hedef verdiğinde somut işler eklenecek. Henüz doğrulanmamış büyüme veya gelir varsayımları otomatik geliştirme işi değildir.
- Zamanlanmış çalışma sıklığı kullanıcı tercihine göre ayrıca belirlenir; bu dosya bir zamanlayıcı değildir.

## İlk turun doğrulaması

108 birim testi, 53 dil/SEO testi ve 192 Chromium/WebKit testi geçti (toplam 353). Üç TOML rolü ve concurrency ayarı parse edilerek doğrulandı. PR/main concurrency anahtarlarının ayrıldığı ayrıca kontrol edildi. Astro check: sıfır hata, uyarı ve ipucu. İlk yerel geniş tarayıcı turu zaman aşımına uğramıştı; odaklı dört test ve sonraki tam 192 testlik tur başarılı tamamlandı.

Koordinatörün PR/CI ve canlı yayın doğrulaması sonuç raporunda saklanır.
