# MiniKit ajan ekibi

Bu proje için yedi uzman rolü ve bir koordinatör tanımlıdır. Bir görevde ihtiyaca uygun roller seçilir; aynı anda en fazla üç uzman çalışır. Roller görev boyunca etkinleşir. Bu kurulum zamanlanmış görev veya yeni ücretli hizmet oluşturmaz.

| Rol | Kalıcı tanım | Sorumluluk |
|---|---|---|
| Yeni araç geliştirici | `.codex/agents/minikit_tool_builder.toml` | Katalogda bulunmayan aracı form, işlev, 50 dil, rehber ve testleriyle tamamlar |
| Ürün araştırma | `.codex/agents/minikit_product_research.toml` | Araç fikirlerini kullanıcı yararı, farklılık ve uygulanabilirlik açısından önceliklendirir |
| Bakım/geliştirme | `.codex/agents/minikit_development.toml` | Mevcut araç hataları, altyapı ve performans |
| SEO/içerik | `.codex/agents/minikit_seo_content.toml` | Gerçek örnekler, sınırlar, yerelleştirme ve teknik SEO |
| UX/erişilebilirlik | `.codex/agents/minikit_ux_accessibility.toml` | Mobil kullanım, klavye/fokus, form açıklığı ve RTL |
| Analitik/büyüme | `.codex/agents/minikit_analytics_growth.toml` | Kaynaklı trafik/arama verisini yorumlar; ölçülebilir deneyler önerir |
| Kalite/güvenlik | `.codex/agents/minikit_quality_security.toml` | Regresyonlar, tarayıcılar, CI ve gizlilik sınırları |
| Koordinatör | `AGENTS.md` | İş seçimi, dosya sahipliği, entegrasyon, doğrulama ve yayın |

## Hangi görevde kim çalışır?

- **Yeni araç:** Koordinatör katalog kontrolü ve gerekiyorsa ürün araştırmasından sonra aracı seçer. Yeni araç geliştirici uygulamayı, içerik ajanı dil/rehber işini, kalite ajanı kabul testlerini üstlenir. Ortak dosyalar sırayla düzenlenir.
- **Mevcut hata:** Bakım/geliştirme ve kalite; kullanıcı yolculuğu etkileniyorsa UX rolü.
- **Trafik/görünürlük:** Analitik/büyüme kaynak veriyi değerlendirir; SEO/içerik ve ürün araştırma uygun önerileri hazırlar. Erişilemeyen veri için sayı veya gelir iddiası üretilmez.

Üç uzman sınırı, roller gerektiğinde aşamalar halinde çalıştırılarak korunur. Bir rol tanımı eklemek ayrı bir sohbet, ek izin veya sürekli çalışan süreç oluşturmaz.

## Örnek görevler

> MiniKit ekibini çalıştır. Katalogda olmayan üç yeni araç adayı araştır, en uygun birini seç, 50 dile ekle ve test ederek yayımla.

> Yeni araç geliştiriciyi çalıştır; MiniKit'e bir metin aracı ekle. İçerik ve kalite ajanlarıyla doğrula.

> UX ajanını çalıştır; mobilde araç bulma ve sonuç indirme akışını incele.

> Analitik ajanını çalıştır; erişilebilir son yedi günlük trafik ve arama verisini kaynaklarıyla değerlendir.

## Çalışma döngüsü

1. Kullanıcı amacı ve kabul ölçütü belirlenir; ortak iş listesinde bir kayıt açılır.
2. Bağımsız işler uygun rollere ayrılır; aynı anda en fazla üç uzman ve her iş için açık dosya sahipliği kullanılır.
3. Ajanlar somut kanıtla döner. Geliştirici bir hatayı düzeltirken kalite ajanı ayrı dosyada davranış testi, içerik ajanı ilgili örneği hazırlayabilir.
4. Koordinatör değişiklikleri inceler, bağımlı adımları sırayla çalıştırır ve gereken testleri tamamlar.
5. Mevcut yetki kapsamında PR/yayın yapılır; canlı sonuç doğrulanır ve iş listesi güncellenir.

Ortak çalışma alanında aynı dosyaya eşzamanlı yazılmaz. Ajanlara görev dışı commit, yayın, hesap değişikliği veya alt ekip oluşturma işi verilmez. Bu, mevcut kullanıcı yetkisinin yerine yeni onay adımı koymaz.

## İlk görev turu — 27 Ekim 2026

- Geliştirme ajanı, QR üretimi sürerken giriş değişince eski sonucun gösterilebildiğini tarayıcıda doğruladı; işlem bileti ile iptal düzeltmesini uyguladı.
- İçerik ajanı, Türkçe büyük harf ve JSON karşılaştırma örneklerindeki uyumsuzlukları buldu; örnekleri gerçek fonksiyonlarla eşleştiren kontroller ekledi. Mevcut çevrilmiş JSON/YAML sınırları rehberlere de eklendi.
- Kalite ajanı, PR/main yayın işlerinin ortak concurrency grubu nedeniyle birbirini iptal edebildiğini ve Markdown önizleme gizlilik sınırının işlevsel test eksiğini buldu; ayrı test dosyasında doğruladı. Rapor çıktılarının TypeScript kontrolüne girmesini de engelledi.

İlerleme ve kabul ölçütleri `BACKLOG.md` içinde tutulur. Yeni tur için örnek istek: “MiniKit ekibini çalıştır; iş listesindeki en önemli işi geliştir, içerik ve kalite ajanlarıyla doğrula.”

## Teknik kaynak

Özel ajan dosyalarının şeması ve kapsamı: https://learn.chatgpt.com/docs/agent-configuration/subagents

Rol tanımları model, hesap izni veya sandbox sınırını genişletmez. Proje ayarı aynı anda üç aktif uzman sınırı koyar; gerçek eşzamanlılık oturumun mevcut kapasitesiyle sınırlıdır. Kalıcı profiller yeni/uygun proje oturumlarında keşfedilir; bu ilk tur aynı talimatları verilen canlı alt ajanlarla çalıştırıldı.


## Rol havuzunun genişletilmesi — 27 Ekim 2026

Kullanıcının yeni araç ekleme ve önerilen ajanları tanımlama isteğiyle yeni araç geliştirici, ürün araştırma, UX/erişilebilirlik ve analitik/büyüme rolleri eklendi. Bakım rolü mevcut araçlara odaklanacak şekilde netleştirildi. Model, düşünme ve hesap izinleri devralınmaya devam ediyor; eşzamanlı uzman sınırı üç olarak korundu. Bu değişiklik yeni bir araç uygulaması veya analitik takip kodu eklemez.
