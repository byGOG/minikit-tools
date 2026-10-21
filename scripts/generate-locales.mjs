import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const provider = 'https://api.mymemory.translated.net';
// Spanish is already cached by the previous deployment. Add ten widely used
// languages and reuse each published dictionary so free-provider quota is spent
// only on translations that have not succeeded before.
const candidates = [
  ['es', 'Español'],
  ['de', 'Deutsch'],
  ['fr', 'Français'],
  ['pt', 'Português'],
  ['ru', 'Русский'],
  ['it', 'Italiano'],
  ['ar', 'العربية'],
  ['zh', '简体中文'],
  ['ja', '日本語'],
  ['hi', 'हिन्दी'],
  ['id', 'Bahasa Indonesia'],
];
// These curated locale dictionaries finish the remaining languages without
// sending site copy or personal data to another translation service.
const offlineLocaleText = {
  "ar": {
    "announcement": "مهام صغيرة، أصبحت أسهل. MiniKit متاح الآن.",
    "explore": "استكشف",
    "navTools": "الأدوات",
    "navWhy": "لماذا MiniKit؟",
    "navPrivacy": "الخصوصية",
    "navCta": "استكشف الأدوات",
    "eyebrow": "أدوات مفيدة لكل يوم",
    "heroTitle": "اختصار صغير<br/><span>لمهامك اليومية.</span>",
    "heroLead": "حوّل الصور، وأنشئ رموز QR، واحسب كلماتك. كل الأدوات العملية التي تحتاجها في مكان واحد.",
    "heroCta": "جرّب الأدوات مجانًا",
    "heroProof": "لا حاجة إلى حساب · مجاني دائمًا",
    "privacyLine": "تبقى ملفاتك على جهازك. بلا رفع ملفات أو إنشاء حساب.",
    "ready": "جاهز!",
    "quickTools": "أدوات سريعة",
    "pickTool": "ما الذي تريد إنجازه اليوم؟",
    "compress": "ضغط صورة",
    "makeQr": "إنشاء رمز QR",
    "countWords": "عدّ الكلمات",
    "convertColor": "تحويل اللون",
    "privateDevice": "يعمل بالكامل على جهازك. خصوصية دائمة.",
    "statFast": "يعمل فورًا",
    "statPrivate": "الخصوصية أولًا",
    "statFree": "مجاني وسهل",
    "statNew": "أدوات جديدة كل أسبوع",
    "toolsEyebrow": "مجموعة أدواتك",
    "toolsTitle": "أدوات تنجز المهمة.<br/><span>من دون أي شيء زائد.</span>",
    "toolsAvailable": "أدوات جاهزة",
    "free": "مجاني",
    "imageTitle": "محوّل الصور",
    "imageDesc": "حوّل الصور إلى WebP أو JPEG أو PNG، أو قلّل حجمها.",
    "uploadChoose": "اختر صورة أو اسحبها إلى هنا",
    "fileLimit": "JPG وPNG وWEBP · حتى 20 MB",
    "outputFormat": "تنسيق الإخراج",
    "quality": "الجودة",
    "convertDownload": "حوّل ونزّل",
    "localImage": "تُعالج الصورة على جهازك",
    "qrTitle": "منشئ رموز QR",
    "qrDesc": "أدخل رابطًا أو نصًا قصيرًا، ثم نزّل رمز QR وشاركه.",
    "qrLabel": "رابط أو نص",
    "qrEmpty": "سيظهر رمز QR هنا",
    "generateQr": "إنشاء رمز QR",
    "downloadQr": "تنزيل رمز QR",
    "localQr": "يُنشأ الرمز على هذا الجهاز",
    "wordTitle": "عداد الكلمات",
    "wordDesc": "اعرف فورًا عدد الكلمات والأحرف ووقت القراءة.",
    "pasteText": "اكتب النص هنا",
    "words": "كلمات",
    "characters": "أحرف",
    "readTime": "وقت القراءة",
    "clearText": "مسح النص",
    "localWord": "لا يغادر نصك جهازك",
    "colorTitle": "محوّل الألوان",
    "colorDesc": "بدّل بسهولة بين قيم HEX وRGB وHSL.",
    "chooseColor": "اختر لونًا",
    "preview": "معاينة",
    "localColor": "تُحسب القيم فورًا",
    "whyEyebrow": "جهد أقل، إنجاز أكثر",
    "whyTitle": "ركّز على مهمتك،<br/>لا على البحث عن أداة.",
    "whyLead": "لست بحاجة إلى موقع مختلف لكل مهمة صغيرة. يجمع MiniKit الأدوات العملية التي تستخدمها كثيرًا في مكان واحد واضح وسهل.",
    "allTools": "استكشف الأدوات",
    "benefitOneTitle": "سريع فعلًا",
    "benefitOne": "افتح الأداة وأنجز المهمة وتابع يومك. بلا تنزيل أو تسجيل أو انتظار.",
    "benefitTwoTitle": "الخصوصية أولًا",
    "benefitTwo": "تبقى ملفاتك ونصوصك على جهازك. لا نخزّن بياناتك.",
    "benefitThreeTitle": "بسيط للجميع",
    "benefitThree": "لا قوائم مربكة. ما تحتاجه في المكان المناسب.",
    "privacyEyebrow": "خصوصية من البداية",
    "privacyTitle": "تنجز ملفاتك عملها<br/><span>من دون المرور عبر خوادمنا.</span>",
    "privacyLead": "تُعالج الصور في متصفحك. وتُنشأ رموز QR والألوان على جهازك. يبقى نصك لديك. سنحدّث هذا الإشعار إذا أضفنا خدمات التحليلات أو الإعلانات.",
    "privacyStamp": "الخصوصية أولًا",
    "ctaTitle": "اجعل مهمتك الصغيرة التالية<br/>أسهل قليلًا.",
    "ctaLead": "جرّب أداتك الأولى الآن. مجانية، بلا حساب، وبلا عناء.",
    "ctaButton": "لنبدأ",
    "footerLine": "اختصارات صغيرة لمهامك اليومية.",
    "madeWith": "صُنع بعناية، للجميع.",
    "imageTooLarge": "يتجاوز هذا الملف الحد الأقصى البالغ 20 MB.",
    "imageInvalid": "يرجى اختيار صورة صالحة.",
    "imageConverted": "اكتمل التحويل. سيبدأ التنزيل الآن.",
    "imageFailed": "تعذّر تحويل الصورة. جرّب تنسيقًا آخر.",
    "qrMissing": "يرجى إدخال رابط أو نص.",
    "qrReady": "رمز QR جاهز.",
    "qrFailed": "تعذّر إنشاء رمز QR. جرّب نصًا أقصر.",
    "copied": "تم النسخ إلى الحافظة.",
    "invalidColor": "أدخل لون HEX صالحًا (مثل #155C42).",
    "menuOpen": "فتح القائمة",
    "menuClose": "إغلاق القائمة",
    "cleared": "تم مسح النص.",
    "sec": "ث",
    "min": "د",
    "copyFail": "تعذّر النسخ؛ حدّد القيمة وانسخها.",
    "metaTitle": "MiniKit — أدوات مجانية لمهامك اليومية",
    "metaDescription": "حوّل الصور، وأنشئ رموز QR، وعدّ الكلمات، وحوّل الألوان. مجاني وسريع ويحافظ على خصوصيتك."
  },
  "zh": {
    "announcement": "小任务，轻松完成。MiniKit 现已上线。",
    "explore": "探索",
    "navTools": "工具",
    "navWhy": "为什么选择 MiniKit？",
    "navPrivacy": "隐私",
    "navCta": "探索工具",
    "eyebrow": "日常实用工具",
    "heroTitle": "日常任务的<br/><span>小小捷径。</span>",
    "heroLead": "转换图片、生成二维码、统计文字。你需要的实用工具，都在一个简洁的地方。",
    "heroCta": "免费试用工具",
    "heroProof": "无需账户 · 始终免费",
    "privacyLine": "文件保留在你的设备上。无需上传，也无需注册。",
    "ready": "就绪！",
    "quickTools": "快捷工具",
    "pickTool": "今天想做什么？",
    "compress": "压缩图片",
    "makeQr": "生成二维码",
    "countWords": "统计字数",
    "convertColor": "转换颜色",
    "privateDevice": "完全在本地运行，始终保护隐私。",
    "statFast": "即时完成",
    "statPrivate": "隐私优先",
    "statFree": "免费又简单",
    "statNew": "每周推出新工具",
    "toolsEyebrow": "你的工具箱",
    "toolsTitle": "实用工具，高效完成。<br/><span>只保留你需要的。</span>",
    "toolsAvailable": "个工具可用",
    "free": "免费",
    "imageTitle": "图片转换器",
    "imageDesc": "将图片转换为 WebP、JPEG 或 PNG，也可缩小文件体积。",
    "uploadChoose": "选择图片或拖放到此处",
    "fileLimit": "JPG、PNG、WEBP · 最大 20 MB",
    "outputFormat": "输出格式",
    "quality": "质量",
    "convertDownload": "转换并下载",
    "localImage": "图片在你的设备上处理",
    "qrTitle": "二维码生成器",
    "qrDesc": "输入链接或简短文字，然后下载并分享二维码。",
    "qrLabel": "链接或文字",
    "qrEmpty": "二维码将显示在这里",
    "generateQr": "生成二维码",
    "downloadQr": "下载二维码",
    "localQr": "二维码在此设备上生成",
    "wordTitle": "字数统计",
    "wordDesc": "即时查看字数、字符数和阅读时间。",
    "pasteText": "在此输入文字",
    "words": "字",
    "characters": "字符",
    "readTime": "阅读时间",
    "clearText": "清空文字",
    "localWord": "文字不会离开你的设备",
    "colorTitle": "颜色转换器",
    "colorDesc": "轻松转换 HEX、RGB 和 HSL 颜色值。",
    "chooseColor": "选择颜色",
    "preview": "预览",
    "localColor": "数值即时计算",
    "whyEyebrow": "少些麻烦，多些效率",
    "whyTitle": "专注完成任务，<br/>无需到处寻找工具。",
    "whyLead": "无需为每个小任务打开不同网站。MiniKit 将常用实用工具整合在一个清晰易用的地方。",
    "allTools": "探索全部工具",
    "benefitOneTitle": "真正快速",
    "benefitOne": "打开、完成、继续。无需下载、注册或等待。",
    "benefitTwoTitle": "隐私优先",
    "benefitTwo": "文件和文字都保留在你的设备上。我们不会存储你的数据。",
    "benefitThreeTitle": "人人都能轻松使用",
    "benefitThree": "没有复杂菜单。你需要的功能就在该在的位置。",
    "privacyEyebrow": "从设计开始保护隐私",
    "privacyTitle": "你的文件完成任务<br/><span>无需经过我们的服务器。</span>",
    "privacyLead": "图片在浏览器中处理。二维码和颜色在你的设备上生成。文字只属于你。如果添加分析或广告服务，我们会更新此说明。",
    "privacyStamp": "隐私优先",
    "ctaTitle": "让下一个小任务<br/>变得轻松一点。",
    "ctaLead": "现在试用第一个工具。免费、无需账户、简单省心。",
    "ctaButton": "开始使用",
    "footerLine": "让日常任务更轻松的小捷径。",
    "madeWith": "用心打造，人人可用。",
    "imageTooLarge": "文件超过 20 MB 限制。",
    "imageInvalid": "请选择有效的图片文件。",
    "imageConverted": "转换完成，正在开始下载。",
    "imageFailed": "无法转换图片，请尝试其他格式。",
    "qrMissing": "请输入链接或文字。",
    "qrReady": "二维码已准备就绪。",
    "qrFailed": "无法生成二维码，请尝试更短的文字。",
    "copied": "已复制到剪贴板。",
    "invalidColor": "请输入有效的 HEX 颜色（例如 #155C42）。",
    "menuOpen": "打开菜单",
    "menuClose": "关闭菜单",
    "cleared": "文字已清空。",
    "sec": "秒",
    "min": "分钟",
    "copyFail": "无法复制；请选中并复制该值。",
    "metaTitle": "MiniKit — 日常任务的免费工具",
    "metaDescription": "转换图片、生成二维码、统计字数并转换颜色。免费、快速且注重隐私。"
  },
  "ja": {
    "announcement": "小さな作業を、もっと簡単に。MiniKit を公開しました。",
    "explore": "見る",
    "navTools": "ツール",
    "navWhy": "MiniKit について",
    "navPrivacy": "プライバシー",
    "navCta": "ツールを見る",
    "eyebrow": "毎日に役立つツール",
    "heroTitle": "毎日の作業を<br/><span>少し楽にする近道。</span>",
    "heroLead": "画像の変換、QRコードの作成、文字数のカウント。必要な便利ツールをひとつの場所にまとめました。",
    "heroCta": "無料ツールを試す",
    "heroProof": "アカウント不要 · ずっと無料",
    "privacyLine": "ファイルは端末内に保存されます。アップロードも登録も不要です。",
    "ready": "準備完了！",
    "quickTools": "クイックツール",
    "pickTool": "今日は何をしますか？",
    "compress": "画像を圧縮",
    "makeQr": "QRコードを作成",
    "countWords": "文字数を数える",
    "convertColor": "色を変換",
    "privateDevice": "すべて端末内で処理。いつでもプライベート。",
    "statFast": "すぐに使える",
    "statPrivate": "プライバシーを優先",
    "statFree": "無料で簡単",
    "statNew": "毎週新しいツール",
    "toolsEyebrow": "ツールボックス",
    "toolsTitle": "作業に役立つツール。<br/><span>必要なものだけ。</span>",
    "toolsAvailable": "個のツールを利用可能",
    "free": "無料",
    "imageTitle": "画像変換ツール",
    "imageDesc": "画像を WebP、JPEG、PNG に変換したり、ファイルサイズを小さくできます。",
    "uploadChoose": "画像を選択するか、ここにドロップ",
    "fileLimit": "JPG、PNG、WEBP · 最大 20 MB",
    "outputFormat": "出力形式",
    "quality": "品質",
    "convertDownload": "変換してダウンロード",
    "localImage": "画像は端末内で処理されます",
    "qrTitle": "QRコード生成",
    "qrDesc": "リンクまたは短いテキストを入力し、QRコードをダウンロードして共有できます。",
    "qrLabel": "リンクまたはテキスト",
    "qrEmpty": "ここにQRコードが表示されます",
    "generateQr": "QRコードを作成",
    "downloadQr": "QRコードをダウンロード",
    "localQr": "QRコードはこの端末で作成されます",
    "wordTitle": "文字数カウンター",
    "wordDesc": "単語数、文字数、読了時間をすぐに確認できます。",
    "pasteText": "ここにテキストを入力",
    "words": "単語",
    "characters": "文字",
    "readTime": "読了時間",
    "clearText": "テキストを消去",
    "localWord": "テキストは端末の外に送信されません",
    "colorTitle": "カラー変換",
    "colorDesc": "HEX、RGB、HSL の値を簡単に切り替えられます。",
    "chooseColor": "色を選択",
    "preview": "プレビュー",
    "localColor": "値はすぐに計算されます",
    "whyEyebrow": "手間を減らして、作業を進める",
    "whyTitle": "ツール探しではなく、<br/>作業そのものに集中。</span>",
    "whyLead": "小さな作業のたびに別のサイトへ行く必要はありません。MiniKit はよく使う便利なツールを、わかりやすい場所にまとめています。",
    "allTools": "ツールを見る",
    "benefitOneTitle": "本当に速い",
    "benefitOne": "開いて、使って、完了。ダウンロードも登録も待ち時間もありません。",
    "benefitTwoTitle": "プライバシー優先",
    "benefitTwo": "ファイルやテキストは端末内に残ります。データは保存しません。",
    "benefitThreeTitle": "誰でも簡単",
    "benefitThree": "複雑なメニューはありません。必要な機能がすぐ見つかります。",
    "privacyEyebrow": "設計からプライバシーを重視",
    "privacyTitle": "ファイルは私たちを経由せず<br/><span>端末内で処理されます。</span>",
    "privacyLead": "画像はブラウザー内で処理します。QRコードと色は端末内で作成します。入力したテキストも端末内に残ります。分析や広告サービスを追加する場合は、この案内を更新します。",
    "privacyStamp": "プライバシー優先",
    "ctaTitle": "次の小さな作業を<br/>少しだけ簡単に。",
    "ctaLead": "最初のツールを今すぐお試しください。無料、登録不要、簡単です。",
    "ctaButton": "始める",
    "footerLine": "毎日の作業を楽にする小さな近道。",
    "madeWith": "みんなのために、丁寧に作りました。",
    "imageTooLarge": "ファイルが 20 MB の上限を超えています。",
    "imageInvalid": "有効な画像ファイルを選択してください。",
    "imageConverted": "変換が完了しました。ダウンロードを開始します。",
    "imageFailed": "画像を変換できませんでした。別の形式をお試しください。",
    "qrMissing": "リンクまたはテキストを入力してください。",
    "qrReady": "QRコードの準備ができました。",
    "qrFailed": "QRコードを作成できませんでした。短いテキストをお試しください。",
    "copied": "クリップボードにコピーしました。",
    "invalidColor": "有効な HEX カラーを入力してください（例：#155C42）。",
    "menuOpen": "メニューを開く",
    "menuClose": "メニューを閉じる",
    "cleared": "テキストを消去しました。",
    "sec": "秒",
    "min": "分",
    "copyFail": "コピーできませんでした。値を選択してコピーしてください。",
    "metaTitle": "MiniKit — 毎日の作業に使える無料ツール",
    "metaDescription": "画像変換、QRコード作成、文字数カウント、色変換。無料で高速、プライバシーにも配慮。"
  },
  "hi": {
    "announcement": "छोटे काम, अब और आसान। MiniKit अब उपलब्ध है।",
    "explore": "देखें",
    "navTools": "टूल",
    "navWhy": "MiniKit क्यों?",
    "navPrivacy": "गोपनीयता",
    "navCta": "टूल देखें",
    "eyebrow": "हर दिन के काम के उपयोगी टूल",
    "heroTitle": "रोज़मर्रा के कामों का<br/><span>एक छोटा सा शॉर्टकट।</span>",
    "heroLead": "इमेज बदलें, QR कोड बनाएँ और शब्द गिनें। आपके ज़रूरी टूल एक ही आसान जगह पर।",
    "heroCta": "मुफ़्त टूल आज़माएँ",
    "heroProof": "खाते की ज़रूरत नहीं · हमेशा मुफ़्त",
    "privacyLine": "आपकी फ़ाइलें आपके डिवाइस पर रहती हैं। न अपलोड, न खाता।",
    "ready": "तैयार!",
    "quickTools": "त्वरित टूल",
    "pickTool": "आज आप क्या करना चाहेंगे?",
    "compress": "इमेज संपीड़ित करें",
    "makeQr": "QR कोड बनाएँ",
    "countWords": "शब्द गिनें",
    "convertColor": "रंग बदलें",
    "privateDevice": "पूरी तरह आपके डिवाइस पर। हमेशा निजी।",
    "statFast": "तुरंत काम करता है",
    "statPrivate": "गोपनीयता सबसे पहले",
    "statFree": "मुफ़्त और आसान",
    "statNew": "हर हफ़्ते नए टूल",
    "toolsEyebrow": "आपका टूलकिट",
    "toolsTitle": "काम के टूल।<br/><span>सिर्फ़ वही जो ज़रूरी है।</span>",
    "toolsAvailable": "टूल उपलब्ध",
    "free": "मुफ़्त",
    "imageTitle": "इमेज कन्वर्टर",
    "imageDesc": "इमेज को WebP, JPEG या PNG में बदलें या फ़ाइल का आकार कम करें।",
    "uploadChoose": "इमेज चुनें या यहाँ छोड़ें",
    "fileLimit": "JPG, PNG, WEBP · अधिकतम 20 MB",
    "outputFormat": "आउटपुट फ़ॉर्मैट",
    "quality": "गुणवत्ता",
    "convertDownload": "बदलें और डाउनलोड करें",
    "localImage": "इमेज आपके डिवाइस पर संसाधित होती है",
    "qrTitle": "QR कोड जनरेटर",
    "qrDesc": "लिंक या छोटा टेक्स्ट डालें, फिर QR कोड डाउनलोड करके साझा करें।",
    "qrLabel": "लिंक या टेक्स्ट",
    "qrEmpty": "आपका QR कोड यहाँ दिखेगा",
    "generateQr": "QR कोड बनाएँ",
    "downloadQr": "QR कोड डाउनलोड करें",
    "localQr": "कोड इसी डिवाइस पर बनता है",
    "wordTitle": "शब्द गणक",
    "wordDesc": "शब्द, अक्षर और पढ़ने का समय तुरंत देखें।",
    "pasteText": "अपना टेक्स्ट यहाँ लिखें",
    "words": "शब्द",
    "characters": "अक्षर",
    "readTime": "पढ़ने का समय",
    "clearText": "टेक्स्ट साफ़ करें",
    "localWord": "आपका टेक्स्ट डिवाइस से बाहर नहीं जाता",
    "colorTitle": "रंग कन्वर्टर",
    "colorDesc": "HEX, RGB और HSL मानों के बीच आसानी से बदलें।",
    "chooseColor": "रंग चुनें",
    "preview": "पूर्वावलोकन",
    "localColor": "मान तुरंत गणना किए जाते हैं",
    "whyEyebrow": "कम झंझट, ज़्यादा काम",
    "whyTitle": "टूल खोजने के बजाय,<br/>अपने काम पर ध्यान दें।",
    "whyLead": "हर छोटे काम के लिए अलग वेबसाइट की ज़रूरत नहीं। MiniKit आपके काम के उपयोगी टूल को एक साफ़ और आसान जगह पर लाता है।",
    "allTools": "सभी टूल देखें",
    "benefitOneTitle": "वाकई तेज़",
    "benefitOne": "खोलें, काम करें, आगे बढ़ें। कोई डाउनलोड, साइन-अप या इंतज़ार नहीं।",
    "benefitTwoTitle": "गोपनीयता पहले",
    "benefitTwo": "आपकी फ़ाइलें और टेक्स्ट आपके डिवाइस पर रहते हैं। हम आपका डेटा सहेजते नहीं।",
    "benefitThreeTitle": "सबके लिए आसान",
    "benefitThree": "उलझाने वाले मेनू नहीं। ज़रूरी चीज़ वहीं है जहाँ होनी चाहिए।",
    "privacyEyebrow": "शुरू से ही निजी",
    "privacyTitle": "आपकी फ़ाइलें काम करती हैं<br/><span>हमारे सर्वर से गुज़रे बिना।</span>",
    "privacyLead": "इमेज आपके ब्राउज़र में संसाधित होती हैं। QR कोड और रंग आपके डिवाइस पर बनते हैं। आपका टेक्स्ट आपके पास रहता है। विश्लेषण या विज्ञापन सेवाएँ जोड़ने पर यह सूचना अपडेट होगी।",
    "privacyStamp": "गोपनीयता पहले",
    "ctaTitle": "अपना अगला छोटा काम<br/>थोड़ा आसान बनाएँ।",
    "ctaLead": "अपना पहला टूल अभी आज़माएँ। मुफ़्त, बिना खाते और आसान।",
    "ctaButton": "शुरू करें",
    "footerLine": "रोज़मर्रा के कामों के छोटे शॉर्टकट।",
    "madeWith": "सबके लिए, ध्यान से बनाया गया।",
    "imageTooLarge": "यह फ़ाइल 20 MB की सीमा से बड़ी है।",
    "imageInvalid": "कृपया मान्य इमेज चुनें।",
    "imageConverted": "कन्वर्ज़न पूरा। डाउनलोड शुरू हो रहा है।",
    "imageFailed": "इमेज नहीं बदल सकी। कोई दूसरा फ़ॉर्मैट आज़माएँ।",
    "qrMissing": "कृपया लिंक या टेक्स्ट दर्ज करें।",
    "qrReady": "आपका QR कोड तैयार है।",
    "qrFailed": "QR कोड नहीं बन सका। छोटा टेक्स्ट आज़माएँ।",
    "copied": "क्लिपबोर्ड पर कॉपी किया गया।",
    "invalidColor": "मान्य HEX रंग दर्ज करें (जैसे #155C42)।",
    "menuOpen": "मेनू खोलें",
    "menuClose": "मेनू बंद करें",
    "cleared": "टेक्स्ट साफ़ किया गया।",
    "sec": "सेकंड",
    "min": "मिनट",
    "copyFail": "कॉपी नहीं हो सका; मान चुनकर कॉपी करें।",
    "metaTitle": "MiniKit — रोज़मर्रा के कामों के लिए मुफ़्त टूल",
    "metaDescription": "इमेज बदलें, QR कोड बनाएँ, शब्द गिनें और रंग कन्वर्ट करें। मुफ़्त, तेज़ और निजी।"
  },
  "id": {
    "announcement": "Pekerjaan kecil jadi lebih mudah. MiniKit kini tersedia.",
    "explore": "Jelajahi",
    "navTools": "Alat",
    "navWhy": "Mengapa MiniKit?",
    "navPrivacy": "Privasi",
    "navCta": "Jelajahi alat",
    "eyebrow": "Alat praktis untuk keseharian",
    "heroTitle": "Jalan pintas kecil<br/><span>untuk tugas sehari-hari.</span>",
    "heroLead": "Ubah gambar, buat kode QR, dan hitung kata. Semua alat praktis yang Anda butuhkan ada di satu tempat.",
    "heroCta": "Coba alat gratis",
    "heroProof": "Tanpa akun · Selalu gratis",
    "privacyLine": "File Anda tetap di perangkat. Tanpa unggahan dan tanpa akun.",
    "ready": "Siap!",
    "quickTools": "Alat cepat",
    "pickTool": "Apa yang ingin Anda lakukan hari ini?",
    "compress": "Kompres gambar",
    "makeQr": "Buat kode QR",
    "countWords": "Hitung kata",
    "convertColor": "Konversi warna",
    "privateDevice": "Sepenuhnya di perangkat Anda. Selalu privat.",
    "statFast": "Bekerja seketika",
    "statPrivate": "Privasi adalah prioritas",
    "statFree": "Gratis dan mudah",
    "statNew": "Alat baru setiap minggu",
    "toolsEyebrow": "KOTAK ALAT ANDA",
    "toolsTitle": "Alat yang membantu pekerjaan.<br/><span>Hanya yang Anda perlukan.</span>",
    "toolsAvailable": "alat tersedia",
    "free": "GRATIS",
    "imageTitle": "Konverter gambar",
    "imageDesc": "Ubah gambar ke WebP, JPEG, atau PNG, atau perkecil ukuran file.",
    "uploadChoose": "Pilih gambar atau seret ke sini",
    "fileLimit": "JPG, PNG, WEBP · Maksimal 20 MB",
    "outputFormat": "Format keluaran",
    "quality": "Kualitas",
    "convertDownload": "Konversi & unduh",
    "localImage": "Gambar diproses di perangkat Anda",
    "qrTitle": "Pembuat kode QR",
    "qrDesc": "Masukkan tautan atau teks singkat, lalu unduh dan bagikan kode QR.",
    "qrLabel": "Tautan atau teks",
    "qrEmpty": "Kode QR Anda akan muncul di sini",
    "generateQr": "Buat kode QR",
    "downloadQr": "Unduh kode QR",
    "localQr": "Kode dibuat di perangkat ini",
    "wordTitle": "Penghitung kata",
    "wordDesc": "Lihat jumlah kata, karakter, dan waktu baca secara instan.",
    "pasteText": "Ketik teks Anda di sini",
    "words": "Kata",
    "characters": "Karakter",
    "readTime": "Waktu baca",
    "clearText": "Hapus teks",
    "localWord": "Teks Anda tidak pernah meninggalkan perangkat",
    "colorTitle": "Konverter warna",
    "colorDesc": "Beralih dengan mudah antara nilai HEX, RGB, dan HSL.",
    "chooseColor": "Pilih warna",
    "preview": "Pratinjau",
    "localColor": "Nilai dihitung secara instan",
    "whyEyebrow": "Lebih sedikit repot, lebih banyak selesai",
    "whyTitle": "Fokus pada pekerjaan Anda,<br/>bukan mencari alat.",
    "whyLead": "Anda tidak perlu situs berbeda untuk setiap tugas kecil. MiniKit mengumpulkan alat praktis yang paling sering Anda gunakan di satu tempat yang jelas dan mudah.",
    "allTools": "Jelajahi semua alat",
    "benefitOneTitle": "Benar-benar cepat",
    "benefitOne": "Buka, lakukan, lanjutkan. Tanpa unduhan, formulir pendaftaran, atau menunggu.",
    "benefitTwoTitle": "Privasi utama",
    "benefitTwo": "File dan teks Anda tetap di perangkat. Kami tidak menyimpan data Anda.",
    "benefitThreeTitle": "Sederhana untuk semua",
    "benefitThree": "Tanpa menu yang membingungkan. Yang Anda perlukan ada di tempatnya.",
    "privacyEyebrow": "Privat sejak dirancang",
    "privacyTitle": "File Anda menyelesaikan tugas<br/><span>tanpa melewati server kami.</span>",
    "privacyLead": "Gambar diproses di browser Anda. Kode QR dan warna dibuat di perangkat Anda. Teks tetap bersama Anda. Pemberitahuan ini akan diperbarui jika layanan analitik atau iklan ditambahkan.",
    "privacyStamp": "PRIVASI UTAMA",
    "ctaTitle": "Buat tugas kecil berikutnya<br/>jadi sedikit lebih mudah.",
    "ctaLead": "Coba alat pertama Anda sekarang. Gratis, tanpa akun, tanpa repot.",
    "ctaButton": "Mulai sekarang",
    "footerLine": "Jalan pintas kecil untuk tugas sehari-hari.",
    "madeWith": "Dibuat dengan cermat, untuk semua orang.",
    "imageTooLarge": "File ini melebihi batas 20 MB.",
    "imageInvalid": "Pilih file gambar yang valid.",
    "imageConverted": "Konversi selesai. Unduhan akan segera dimulai.",
    "imageFailed": "Gambar tidak dapat dikonversi. Coba format lain.",
    "qrMissing": "Masukkan tautan atau teks.",
    "qrReady": "Kode QR Anda siap.",
    "qrFailed": "Kode QR tidak dapat dibuat. Coba teks yang lebih singkat.",
    "copied": "Disalin ke papan klip.",
    "invalidColor": "Masukkan warna HEX yang valid (misalnya #155C42).",
    "menuOpen": "Buka menu",
    "menuClose": "Tutup menu",
    "cleared": "Teks dihapus.",
    "sec": "dtk",
    "min": "mnt",
    "copyFail": "Tidak dapat menyalin; pilih lalu salin nilainya.",
    "metaTitle": "MiniKit — Alat gratis untuk tugas sehari-hari",
    "metaDescription": "Konversi gambar, buat kode QR, hitung kata, dan konversi warna. Gratis, cepat, dan privat."
  }
};

const spanishOverrides = {
  announcement: 'Tareas pequeñas, más sencillas. MiniKit ya está disponible.',
  eyebrow: 'HERRAMIENTAS PRÁCTICAS PARA EL DÍA A DÍA',
  heroTitle: 'Un pequeño atajo<br/><span>para tus tareas diarias.</span>',
  heroLead: 'Convierte imágenes, crea códigos QR y cuenta palabras. Las herramientas prácticas que necesitas, en un solo lugar.',
  heroCta: 'Prueba las herramientas gratis',
  heroProof: 'Sin cuenta · Siempre gratis',
  privacyLine: 'Tus archivos permanecen en tu dispositivo. Sin subir archivos ni crear una cuenta.',
  ready: '¡Listo!', quickTools: 'Accesos rápidos', pickTool: '¿Qué quieres hacer hoy?',
  makeQr: 'Crear código QR', countWords: 'Contar palabras',
  statPrivate: 'Privacidad ante todo', statFree: 'Gratis y fácil de usar',
  toolsEyebrow: 'TUS HERRAMIENTAS',
  toolsTitle: 'Herramientas prácticas.<br/><span>Solo lo que necesitas.</span>',
  toolsAvailable: 'herramientas disponibles',
  imageTitle: 'Convertidor de imágenes', imageDesc: 'Convierte imágenes a WebP, JPEG o PNG, o reduce su tamaño.',
  uploadChoose: 'Elige una imagen o arrástrala aquí', localImage: 'La imagen se procesa en tu dispositivo',
  qrTitle: 'Generador de códigos QR', qrDesc: 'Escribe un enlace o texto breve y descarga el código QR para compartirlo.',
  generateQr: 'Crear código QR', downloadQr: 'Descargar código QR', localQr: 'El código se crea en tu dispositivo',
  wordDesc: 'Consulta al instante el número de palabras, caracteres y el tiempo de lectura.',
  pasteText: 'Escribe o pega tu texto aquí', characters: 'Caracteres',
  colorTitle: 'Convertidor de colores', colorDesc: 'Convierte fácilmente entre los formatos HEX, RGB y HSL.',
  whyEyebrow: 'MENOS ESFUERZO, MÁS RESULTADOS',
  whyTitle: 'Concéntrate en tu tarea,<br/>no en buscar herramientas.',
  benefitOneTitle: 'Rápido de verdad', benefitTwo: 'Tus archivos y textos permanecen en tu dispositivo. No guardamos tus datos.',
  privacyEyebrow: 'PRIVACIDAD DESDE EL DISEÑO',
  privacyTitle: 'Tus archivos hacen su trabajo<br/><span>sin pasar por nuestros servidores.</span>',
  privacyLead: 'Las imágenes se procesan en tu navegador. Los códigos QR y los colores se crean en tu dispositivo. Tu texto se queda contigo. Este aviso se actualizará si añadimos servicios de análisis o publicidad.',
  privacyStamp: 'PRIVACIDAD ANTE TODO',
  ctaTitle: 'Haz que tu próxima tarea<br/>sea un poco más sencilla.',
  madeWith: 'Hecho con cuidado, para todos.',
  imageTooLarge: 'El archivo supera el límite de 20 MB.', imageInvalid: 'Elige un archivo de imagen válido.',
  imageConverted: 'Conversión lista. La descarga comenzará enseguida.',
  imageFailed: 'No se pudo convertir la imagen. Prueba con otro formato.',
  qrMissing: 'Escribe un enlace o un texto.', qrReady: 'Tu código QR está listo.',
  qrFailed: 'No se pudo crear el código QR. Prueba con un texto más corto.',
  invalidColor: 'Escribe un color HEX válido (por ejemplo, #155C42).',
  copyFail: 'No se pudo copiar. Selecciona y copia el valor.',
  metaTitle: 'MiniKit — Herramientas gratuitas para tus tareas diarias',
  metaDescription: 'Convierte imágenes, crea códigos QR, cuenta palabras y convierte colores. Gratis, rápido y privado.',
};
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const htmlEscape = (value) => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');

function readObject(source, start) {
  const opening = source.indexOf('{', start);
  if (opening < 0) throw new Error('Could not locate the English translation object.');
  let depth = 0;
  let quote = '';
  let escaped = false;
  for (let index = opening; index < source.length; index += 1) {
    const char = source[index];
    if (quote) {
      if (escaped) escaped = false;
      else if (char === '\\') escaped = true;
      else if (char === quote) quote = '';
      continue;
    }
    if (char === "'" || char === '"' || char === '`') { quote = char; continue; }
    if (char === '{') depth += 1;
    if (char === '}' && --depth === 0) return source.slice(opening, index + 1);
  }
  throw new Error('The English translation object is incomplete.');
}

function sanitizeTranslatedHtml(value) {
  return value
    .replace(/<(?!\/?(?:span|br)\b)[^>]*>/gi, '')
    .replace(/<span\b[^>]*>/gi, '<span>')
    .replace(/<\/span\s*>/gi, '</span>')
    .replace(/<br\s*\/?>/gi, '<br/>');
}

async function translateEntry(value, target) {
  const tags = [];
  const marked = value.replace(/<br\s*\/?\s*>|<span\b[^>]*>|<\/span\s*>/gi, (tag) => {
    const index = tags.push(tag.toLowerCase().startsWith('<br') ? '<br/>' : tag.startsWith('</') ? '</span>' : '<span>') - 1;
    return `___MINIKIT_TAG_${index}___`;
  });
  const params = new URLSearchParams({ q: marked, langpair: `en|${target}` });
  let lastError;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const response = await fetch(`${provider}/get?${params}`, {
        signal: AbortSignal.timeout(30000),
      });
      if (!response.ok) throw new Error(`MyMemory returned HTTP ${response.status}.`);
      const payload = await response.json();
      if (payload.responseStatus !== 200 || typeof payload.responseData?.translatedText !== 'string') {
        throw new Error(payload.responseDetails || 'MyMemory returned no translated text.');
      }
      const escaped = htmlEscape(payload.responseData.translatedText);
      return escaped.replace(/___MINIKIT_TAG_(\d+)___/gi, (_match, index) => tags[Number(index)] ?? '');
    } catch (error) {
      lastError = error;
      await delay(900 * (attempt + 1));
    }
  }
  throw lastError;
}

function localizeHtml(html, dictionary, locale, options) {
  let output = html.replace(/<html\b[^>]*>/i, `<html lang="${locale}"${locale === 'ar' ? ' dir="rtl"' : ''}>`);

  for (const [key, value] of Object.entries(dictionary)) {
    const safeValue = sanitizeTranslatedHtml(value);
    const expression = new RegExp(`(<([a-z][\\w:-]*)\\b[^>]*\\bdata-i18n=["']${key}["'][^>]*>)([\\s\\S]*?)(<\\/\\2>)`, 'gi');
    output = output.replace(expression, (_all, opening, _tag, _old, closing) => `${opening}${safeValue}${closing}`);
  }

  const title = htmlEscape(dictionary.metaTitle);
  const description = htmlEscape(dictionary.metaDescription);
  output = output.replace(/<title>[\s\S]*?<\/title>/i, `<title>${title}</title>`);
  output = output.replace(/(<meta\s+name="description"\s+content=")[^"]*("\s*\/?>)/i, `$1${description}$2`);
  output = output.replace(/(<meta\s+property="og:title"\s+content=")[^"]*("\s*\/?>)/i, `$1${title}$2`);
  output = output.replace(/(<meta\s+property="og:description"\s+content=")[^"]*("\s*\/?>)/i, `$1${description}$2`);

  const optionsHtml = options.map(({ code, name }) => `<option value="${code}"${code === locale ? ' selected' : ''}>${htmlEscape(name)}</option>`).join('');
  output = output.replace(/<select id="language-select"[^>]*>[\s\S]*?<\/select>/i, `<select id="language-select" class="lang-switch" aria-label="Choose language">${optionsHtml}</select>`);
  return output;
}

const source = await readFile('src/scripts/app.ts', 'utf8');
const enStart = source.indexOf('en: {');
if (enStart < 0) throw new Error('English source translations are missing.');
const english = new Function(`return (${readObject(source, enStart)})`)();
english.metaTitle = 'MiniKit — Free tools for everyday tasks';
english.metaDescription = 'Convert images, generate QR codes, count words and convert colors. Free, fast and private.';

const siteConfig = await readFile('astro.config.mjs', 'utf8');
const site = siteConfig.match(/site:\s*['"]([^'"]+)['"]/i)?.[1];
const base = siteConfig.match(/base:\s*['"]([^'"]+)['"]/i)?.[1]?.replace(/\/$/, '');
if (!site || !base) throw new Error('Could not read the public site URL and base path from astro.config.mjs.');
const rootUrl = new URL(`${base}/`, site).toString();
const dist = 'dist';
const rootHtml = await readFile(join(dist, 'index.html'), 'utf8');
const localeOptions = [{ code: 'tr', name: 'Türkçe' }, { code: 'en', name: 'English' }];
const localeRoutes = [{ code: 'tr', path: '' }];
const generated = { en: english };

let providerLimitHit = false;
try {
  for (const [code, name] of candidates) {
    const dictionary = {};
    let failed = false;
    const offline = offlineLocaleText[code];
    if (offline) Object.assign(dictionary, offline);
    // Reuse the last successful deployment so routine builds do not spend the
    // provider's anonymous quota translating the same copy again.
    try {
      const cached = await fetch(new URL(`locales/${code}.json`, rootUrl), { signal: AbortSignal.timeout(10000) });
      if (cached.ok) Object.assign(dictionary, await cached.json());
    } catch { /* A first deployment has no published locale cache yet. */ }

    const missingEntries = offline
      ? []
      : Object.entries(english).filter(([key]) => typeof dictionary[key] !== 'string');
    for (const [key, value] of missingEntries) {
      try {
        dictionary[key] = await translateEntry(value, code);
        await delay(150);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.warn(`Skipping ${code}: ${message}`);
        failed = true;
        if (/HTTP (?:402|403|429)|quota|daily limit|limit exceeded|too many requests/i.test(message)) {
          providerLimitHit = true;
        }
        break;
      }
    }
    if (code === 'es') Object.assign(dictionary, spanishOverrides);
    if (failed || Object.keys(dictionary).length !== Object.keys(english).length) {
      if (providerLimitHit) break;
      continue;
    }

    localeOptions.push({ code, name });
    localeRoutes.push({ code, path: `${code}/` });
    generated[code] = dictionary;
    console.log(`Generated /${code}/ with ${Object.keys(dictionary).length} translated strings.`);
  }
  if (providerLimitHit) console.warn('Free translation quota reached; publishing all locales translated successfully so far.');
} catch (error) {
  console.warn(`Free translation mirror unavailable; keeping all locales translated successfully so far. ${error instanceof Error ? error.message : String(error)}`);
}

// English is available independently of the community translation mirror.
localeRoutes.push({ code: 'en', path: 'en/' });
await mkdir(join(dist, 'en'), { recursive: true });
for (const [code, dictionary] of Object.entries(generated)) {
  if (code === 'en') continue;
  await mkdir(join(dist, code), { recursive: true });
  await writeFile(join(dist, code, 'index.html'), localizeHtml(rootHtml, dictionary, code, localeOptions), 'utf8');
}
await writeFile(join(dist, 'en', 'index.html'), localizeHtml(rootHtml, english, 'en', localeOptions), 'utf8');

// Rebuild the root language picker after the mirror reports its actual coverage.
const rootOptionsHtml = localeOptions.map(({ code, name }) => `<option value="${code}"${code === 'tr' ? ' selected' : ''}>${htmlEscape(name)}</option>`).join('');
let localizedRoot = rootHtml.replace(/<select id="language-select"[^>]*>[\s\S]*?<\/select>/i, `<select id="language-select" class="lang-switch" aria-label="Choose language">${rootOptionsHtml}</select>`);

const alternatives = localeRoutes.map(({ code, path }) => {
  const href = new URL(path, rootUrl).toString();
  return `<link rel="alternate" hreflang="${code}" href="${href}" />`;
});
alternatives.push(`<link rel="alternate" hreflang="x-default" href="${rootUrl}" />`);
const pages = localeRoutes.map(({ code, path }) => {
  const href = new URL(path, rootUrl).toString();
  const alternateLinks = localeRoutes.map(({ code: alternateCode, path: alternatePath }) => `<xhtml:link rel="alternate" hreflang="${alternateCode}" href="${new URL(alternatePath, rootUrl)}" />`).join('');
  return `<url><loc>${href}</loc>${alternateLinks}<xhtml:link rel="alternate" hreflang="x-default" href="${rootUrl}" /></url>`;
});

async function addSeo(html, url) {
  const headLinks = `<link rel="canonical" href="${url}" />${alternatives.join('')}`;
  return html.replace(/<\/head>/i, `${headLinks}</head>`);
}

localizedRoot = await addSeo(localizedRoot, rootUrl);
await writeFile(join(dist, 'index.html'), localizedRoot, 'utf8');
for (const { code, path } of localeRoutes.filter(({ code }) => code !== 'tr')) {
  const file = join(dist, path, 'index.html');
  try { await writeFile(file, await addSeo(await readFile(file, 'utf8'), new URL(path, rootUrl).toString()), 'utf8'); }
  catch (error) { if (code === 'en') throw error; }
}

await mkdir(join(dist, 'locales'), { recursive: true });
for (const [code, dictionary] of Object.entries(generated)) {
  await writeFile(join(dist, 'locales', `${code}.json`), JSON.stringify(dictionary), 'utf8');
}

await writeFile(join(dist, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">${pages.join('')}</urlset>\n`, 'utf8');
const robotsPath = join(dist, 'robots.txt');
const robots = await readFile(robotsPath, 'utf8').catch(() => 'User-agent: *\nAllow: /\n');
await writeFile(robotsPath, `${robots.trim()}\nSitemap: ${new URL('sitemap.xml', rootUrl)}\n`, 'utf8');

console.log(`Built ${localeRoutes.length} static locale pages: ${localeRoutes.map(({ code }) => code).join(', ')}.`);
