# MiniKit reklam kurulumu

Durum: AdSense hesabı henüz oluşturulmadı. Reklamlar kapalıdır; bu hazırlık gelir başladığı veya Google onayı alındığı anlamına gelmez.

## 1. Hesap ve site başvurusu

1. Site sahibi Önder GÖG, kendi Google hesabıyla https://adsense.google.com/start/ üzerinden ücretsiz hesap açar. Ülke, ödeme, vergi ve kimlik bilgilerini hesap sahibinin kendisi doldurur. Şifre veya ödeme bilgilerini depoya eklemeyin.
2. Site ekleme alanında `https://bygog.github.io` adresini kullanın; proje yolu `/minikit-tools/` tek başına bir alan adı değildir. AdSense arayüzü bu barındırılan alanı kabul etmezse, kullanıcıya ait özel alan adı bağlanması gerekir. Ücretli alan adı satın almak bu kurulumun parçası değildir.
3. `src/data/advertising.json` içindeki `publisherId` alanına gerçek `ca-pub-` + 16 basamak kimliği girin; `enabled` false kalsın. Build, tüm araç/ana sayfalara `google-adsense-account` meta etiketini ekler; Google reklam betiğini yüklemez. AdSense'te meta etiketi ile doğrulamayı seçin ve hesabın gösterdiği doğrulama URL'sini kontrol edin.
4. Google kök ana sayfada meta etiketi ararsa mevcut `byGOG/bygog.github.io` deposunda da aynı meta etiketini eklemek gerekir. Bu değişiklik başka siteyi etkilediği için bu depoda otomatik yapılmaz. Alternatif olarak MiniKit'e özel alan adı kullanın.
5. Hesaptan site incelemesi isteyin. Google kabul/ret kararı verir; gelir veya onay garanti edilmez.

## 2. ads.txt dosyasının doğru adresi

Yayıncı kimliği girildiğinde derleme gerçek kimlikle `dist/ads.txt` üretir. Ancak GitHub proje Pages bunu `https://bygog.github.io/minikit-tools/ads.txt` altında yayımlar. Google'ın beklediği kök adres `https://bygog.github.io/ads.txt` olduğundan aynı içeriğin mevcut `byGOG/bygog.github.io` deposunun yayın köküne eklenmesi gerekir. Orada mevcut satırlar varsa koruyup kendi gerçek satırınızı ekleyin. Hesabınızda gösterilen ads.txt durumunu doğrulayın. Örnek veya uydurma yayıncı kimliği yayımlamayın.

## 3. Onaydan sonra etkinleştirme

1. AdSense Privacy & messaging / Gizlilik ve mesajlaşma bölümünde Avrupa yönetmelikleri mesajını oluşturup yayımlayın. Google'ın sertifikalı CMP'sini kullanın; reddetme ve tercihleri yönetme seçeneklerini yapılandırın. Gerekli diğer bölgesel mesajları hedef kitlenize göre ayarlayın.
2. AdSense'te iki duyarlı görüntülü reklam birimi oluşturun. `topSlot` ve `bottomSlot` alanlarına 10 basamaklı birim kimliklerini girin.
3. Otomatik reklamları kapalı tutun: uygulama yalnızca iki açıkça etiketlenmiş manuel alan kullanır. Yerleşimleri hesap önizlemesinde mobil ve masaüstünde kontrol edin. Google hesabındaki ayarlar bu koddan bağımsızdır.
4. Site onayı tamamlandığında `siteApproved: true`; Google CMP mesajı gerçekten yayımlanıp izin/ret/tercihi yeniden açma davranışı denendiğinde `googleCmpPublished: true`; son olarak `enabled: true` yapın. Bu alan bir CMP oluşturmaz; hesap kurulumunun tamamlandığını kaydeder. Sahte bir özel çerez bildirimi eklenmemiştir.
5. Gizlilik politikasındaki durum yapılandırmaya göre güncellenir. Politika reklam çerezleri, Google/ortakları ve kişiselleştirme tercihleri hakkında açıklama içerir. Hesabınızda etkin diğer reklam sağlayıcıları ve ek veri hizmetleri varsa açıklamalarını da güncelleyin.
6. Build/testleri çalıştırın, yayımlayın, izin mesajı ve reklam davranışını canlıda doğrulayın. Kendi reklamlarınıza tıklamayın. Reklam engelleyici veya Google'ın boş envanteri nedeniyle reklam görünmeyebilir.

`enabled: false` acil kapatma anahtarıdır: sonraki yayında tüm reklam betikleri ve birimler kaldırılır. Yayıncı meta etiketi tek başına reklam isteği yapmaz. Gizlilik/iletişim sayfalarında reklam ve doğrulama kodu bulunmaz.

## Doğrulama

```sh
pnpm run test:tools
pnpm run check
pnpm run build
pnpm run test:locales
```

- https://support.google.com/adsense/answer/7584263?hl=tr
- https://support.google.com/adsense/answer/12171612?hl=tr
- https://support.google.com/adsense/answer/13554116?hl=tr
- https://support.google.com/adsense/answer/1348695?hl=tr
