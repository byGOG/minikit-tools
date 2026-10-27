# MiniKit ajan ekibi

Bu proje için üç uzman ve bir koordinatör kullanılır. Roller görev çalıştırıldığında etkinleşir; kendi başlarına sürekli çalışan servis değildir. Bu kurulum zamanlanmış görev veya yeni ücretli hizmet oluşturmaz.

| Rol | Kalıcı tanım | Sorumluluk |
|---|---|---|
| Geliştirme | `.codex/agents/minikit_development.toml` | Araç davranışı, küçük özellikler, hatalar ve performans |
| SEO/içerik | `.codex/agents/minikit_seo_content.toml` | Gerçek örnekler, sınırlar, yerelleştirme, teknik SEO |
| Kalite/güvenlik | `.codex/agents/minikit_quality_security.toml` | Regresyonlar, tarayıcılar, CI, gizlilik sınırları |
| Koordinatör | `AGENTS.md` | İş seçimi, dosya sahipliği, birleştirme, doğrulama ve yayın |

## Çalışma döngüsü

1. Kullanıcı amacı ve kabul ölçütü belirlenir; ortak iş listesinde bir kayıt açılır.
2. Bağımsız işler üç uzmana ayrılır; her işe açık dosya sahipliği verilir.
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

Rol tanımları model, hesap izni veya sandbox sınırını genişletmez. Proje ayarı üç uzman sınırı koyar; gerçek eşzamanlılık oturumun mevcut kapasitesiyle sınırlıdır. Kalıcı profiller yeni/uygun proje oturumlarında keşfedilir; bu ilk tur aynı talimatları verilen canlı alt ajanlarla çalıştırıldı.
