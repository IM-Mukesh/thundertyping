import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { TypingTestClient } from "@/components/typing-test/typing-test-client";
import { getBundledTypingContent } from "@/lib/typing-engine/typing-content";
import { buildWebApplicationSchema, buildFaqSchema } from "@/lib/seo/json-ld";
import { SITE_NAME, SITE_URL } from "@/lib/seo/constants";
import { Keyboard, Award, CheckCircle2, BookOpen, Sparkles, HelpCircle } from "lucide-react";

export async function generateMetadata(): Promise<Metadata> {
  const title = `हिंदी टाइपिंग टेस्ट ऑनलाइन: Hindi Typing Test (InScript & Mangal) | ${SITE_NAME}`;
  const description =
    "फ्री हिंदी टाइपिंग टेस्ट ऑनलाइन: देवनागरी मंगल फॉन्ट और इनस्क्रिप्ट (InScript) कीबोर्ड लेआउट पर अपनी WPM स्पीड और सटीकता मापें। SSC CGL DEST, CPCT, High Court परीक्षा अभ्यास।";
  const canonicalUrl = `${SITE_URL}/hindi-typing-test`;

  return {
    title: { absolute: title },
    description,
    alternates: { canonical: canonicalUrl },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      siteName: SITE_NAME,
      type: "website",
      images: [{ url: "/opengraph-image" }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/opengraph-image"],
    },
  };
}

const HINDI_FAQS = [
  {
    question: "हिंदी टाइपिंग में InScript और Kruti Dev में क्या मुख्य अंतर है?",
    answer:
      "InScript भारत सरकार द्वारा मानकीकृत यूनिकोड लेआउट है जो देवनागरी लिपि के ध्वन्यात्मक सिद्धांतों पर आधारित है (बाएं हाथ पर सभी स्वर व मात्राएं, दाएं हाथ पर व्यंजन)। यह मंगल (Mangal) और सभी आधुनिक यूनिकोड फॉन्ट्स पर समान रूप से कार्य करता है। Kruti Dev एक गैर-यूनिकोड टाइपराइटर फॉन्ट है। SSC, रेलवे, CPCT और अन्य आधुनिक केंद्रीय भर्ती परीक्षाएं अब यूनिकोड InScript अनिवार्य करती हैं।",
  },
  {
    question: "InScript लेआउट में हलंत और संयुक्त अक्षर (क्ष, त्र, ज्ञ, श्र) कैसे टाइप करें?",
    answer:
      "InScript में संयुक्ताक्षर हलंत/विराम ('d' कुंजी) की सहायता से निर्मित होते हैं:\n• क्ष = क + ् + ष (QWERTY: k + d + <)\n• त्र = त + ् + र (QWERTY: l + d + j)\n• ज्ञ = ज + ् + ञ (QWERTY: p + d + })\n• श्र = श + ् + र (QWERTY: M + d + j)\nHeroTyping का टाइपिंग इंजन देवनागरी वर्ण समूहों (Grapheme Clusters) को स्वतः पहचानकर त्रुटिरहित मूल्यांकन करता है।",
  },
  {
    question: "सरकारी परीक्षाओं (SSC CGL DEST, MP CPCT, High Court) में टाइपिंग स्पीड की गणना कैसे की जाती है?",
    answer:
      "मानक सरकारी परीक्षाओं में 5 की-स्ट्रोक (की-डिप्रेशन, जिसमें स्पेस और विराम चिह्न सम्मिलित हैं) को 1 शब्द माना जाता है। सकल गति (Gross WPM) = (कुल की-स्ट्रोक ÷ 5) ÷ मिनट। शुद्ध गति (Net WPM) प्राप्त करने के लिए अप्रमाणित त्रुटियों का निर्धारित दंड घटाया जाता है।",
  },
  {
    question: "क्या HeroTyping का हिंदी टाइपिंग टेस्ट सरकारी परीक्षा के लिए उपयुक्त है?",
    answer:
      "HeroTyping आपके बुनियादी रिफ्लेक्स, फिंगर-मांसपेशी स्मृति और शुद्धता (Accuracy) को सुदृढ़ करने के लिए सर्वश्रेष्ठ है। परीक्षा की अंतिम तैयारी के लिए आप हमारे 'Custom Text' टूल में वास्तविक सरकारी गद्यांश पेस्ट करके 10 या 15 मिनट की समय-सीमा के साथ हूबहू परीक्षा जैसा माहौल बनाकर अभ्यास कर सकते हैं।",
  },
];

const EXAM_BENCHMARKS = [
  {
    exam: "SSC CGL (Tier II DEST)",
    speed: "27 WPM (135 CPM)",
    description: "15 मिनट में 2000 की-डिप्रेशन। सामान्य वर्ग के लिए 5% और आरक्षित वर्गों के लिए 7% तक की त्रुटि स्वीकार्य।",
  },
  {
    exam: "SSC CHSL (DEO / LDC)",
    speed: "30 WPM (150 CPM)",
    description: "InScript अथवा रेमिंगटन लेआउट पर 15 मिनट की परीक्षा (लगभग 9000 की-डिप्रेशन प्रति घंटा)।",
  },
  {
    exam: "MP CPCT (Hindi Section)",
    speed: "20–30+ WPM",
    description: "20 WPM पर अर्हकारी 50% अंक, 30+ WPM पर उच्च ग्रेड प्रमाणन प्राप्त होता है।",
  },
  {
    exam: "High Court RO / ARO / Clerk",
    speed: "30–35 WPM",
    description: "कड़ी मूल्यांकन प्रणाली: बैकस्पेस सीमित अथवा वर्जित, मात्राओं की शुद्धता पर शत-प्रतिशत ध्यान।",
  },
];

export default async function HindiTypingTestPage({
  params,
}: {
  params?: Promise<{ locale: string }>;
}) {
  const resolvedParams = params ? await params : undefined;
  const locale = resolvedParams?.locale ?? "en";

  const appSchema = buildWebApplicationSchema({
    path: "/hindi-typing-test",
    name: "हिंदी टाइपिंग टेस्ट ऑनलाइन (Hindi Typing Test Online) — HeroTyping",
    description:
      "देवनागरी मंगल फॉन्ट और इनस्क्रिप्ट (InScript) कीबोर्ड लेआउट पर आधारित फ्री ऑनलाइन हिंदी टाइपिंग टेस्ट व अभ्यास।",
    inLanguage: "hi",
  });
  const faqSchema = buildFaqSchema(HINDI_FAQS, "hi");
  const hindiContent = getBundledTypingContent("hi");

  const breadcrumbs = [
    { name: "Typing Test", path: "/" },
    { name: "हिंदी टाइपिंग टेस्ट (Hindi Typing Test)", path: "/hindi-typing-test" },
  ];

  return (
    <div className="flex flex-1 flex-col items-center px-4 py-4 sm:px-8 sm:py-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(appSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      <div className="mx-auto flex w-full max-w-4xl flex-col items-center">
        {/* Breadcrumb Navigation */}
        <div className="mb-4 w-full">
          <Breadcrumbs items={breadcrumbs} locale={locale} />
        </div>

        {/* Page Header (Above the fold) */}
        <header className="mb-6 flex w-full flex-col items-center text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 mb-3 rounded-full bg-accent/10 border border-accent/20 text-accent font-display text-xs font-semibold uppercase tracking-wider">
            <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
            <span>यूनिकोड मंगल फॉन्ट & InScript मानक</span>
          </div>
          <h1 className="font-display text-2xl font-black uppercase tracking-tight text-foreground sm:text-3xl lg:text-4xl">
            हिंदी टाइपिंग टेस्ट ऑनलाइन (Hindi Typing Test)
          </h1>
          <p className="mt-2.5 max-w-2xl text-sm leading-relaxed text-sub sm:text-base">
            मानक देवनागरी इनस्क्रिप्ट (InScript) कीबोर्ड लेआउट और मंगल यूनिकोड फॉन्ट पर अपनी टंकण गति (WPM/CPM) और शुद्धता का निःशुल्क परीक्षण करें। पहला की-स्ट्रोक दबाते ही टाइमर अपने आप शुरू हो जाएगा।
          </p>
        </header>

        {/* Interactive Typing Test Tool */}
        <section aria-label="Hindi Typing Test Tool" className="w-full">
          <TypingTestClient
            locale="hi"
            localizedContent={hindiContent}
            enableTypingLanguageSelection
            initialMode="time"
            initialTimeDuration={60}
          />
        </section>

        {/* Explanatory & Educational Content */}
        <article className="mt-14 flex w-full flex-col gap-10 text-left">
          {/* Section: InScript Layout Mechanics */}
          <section className="flex flex-col gap-4">
            <div className="flex items-center gap-2.5">
              <Keyboard className="h-5 w-5 text-accent shrink-0" aria-hidden="true" />
              <h2 className="font-display text-lg font-bold uppercase tracking-wider text-foreground sm:text-xl">
                इनस्क्रिप्ट (InScript) कीबोर्ड लेआउट की बनावट और नियम
              </h2>
            </div>
            <p className="text-sm leading-relaxed text-sub sm:text-base">
              भारतीय भाषाओं के लिए भारत सरकार के मानकीकरण विभाग द्वारा विकसित <strong>InScript (Indian Script)</strong> लेआउट एक वैज्ञानिक और ध्वन्यात्मक (phonetic) व्यवस्था पर आधारित है। इसे किसी भी मानक QWERTY कीबोर्ड पर बिना किसी विशेष हार्डवेयर के चालू किया जा सकता है:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              <div className="p-4 rounded-xl border border-border/70 bg-sub-alt/15 flex flex-col gap-2">
                <span className="font-semibold text-foreground text-sm flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-accent shrink-0" />
                  बायां हाथ: स्वर एवं मात्राएं (Vowels & Matras)
                </span>
                <p className="text-xs text-sub leading-relaxed">
                  कीबोर्ड के बाएं भाग पर सभी स्वर (अ, आ, इ, ई, उ, ऊ, ए, ऐ, ओ, औ) तथा उनकी संबंधित मात्राएं व्यवस्थित हैं। छोटी उंगली से तर्जनी तक मात्राओं का स्वाभाविक प्रवाह बना रहता है।
                </p>
              </div>
              <div className="p-4 rounded-xl border border-border/70 bg-sub-alt/15 flex flex-col gap-2">
                <span className="font-semibold text-foreground text-sm flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-accent shrink-0" />
                  दायां हाथ: व्यंजन वर्ण (Consonants)
                </span>
                <p className="text-xs text-sub leading-relaxed">
                  कीबोर्ड के दाएं भाग पर स्पर्श व्यंजन (क-वर्ग, च-वर्ग, ट-वर्ग, त-वर्ग, प-वर्ग) और अंतस्थ/ऊष्म वर्ण क्रमबद्ध हैं। दोनों हाथों का यह संतुलन टाइपिंग गति को दोगुना करता है।
                </p>
              </div>
            </div>
            <div className="p-4 rounded-xl border border-accent/20 bg-accent/5 flex flex-col gap-1.5">
              <span className="font-semibold text-foreground text-sm">हलंत ( ् ) और संयुक्ताक्षरों का टाइपिंग फॉर्मूला</span>
              <p className="text-xs text-sub leading-relaxed">
                InScript में हलंत लगाने के लिए <strong>&lsquo;d&rsquo;</strong> कुंजी का उपयोग होता है। किसी भी आधे अक्षर या संयुक्ताक्षर को बनाने के लिए: पहला वर्ण + हलंत (d) + दूसरा वर्ण। जैसे: <code>क + d + ष = क्ष</code>, <code>त + d + र = त्र</code>, <code>ज + d + ञ = ज्ञ</code>, <code>श + d + र = श्र</code>।
              </p>
            </div>
          </section>

          {/* Section: Government Exam Benchmarks */}
          <section className="flex flex-col gap-4">
            <div className="flex items-center gap-2.5">
              <Award className="h-5 w-5 text-accent shrink-0" aria-hidden="true" />
              <h2 className="font-display text-lg font-bold uppercase tracking-wider text-foreground sm:text-xl">
                प्रमुख सरकारी भर्ती परीक्षाओं के हिंदी टाइपिंग मानक
              </h2>
            </div>
            <p className="text-sm leading-relaxed text-sub sm:text-base">
              केंद्र और राज्य सरकारों की प्रतियोगी परीक्षाओं में हिंदी टाइपिंग अहर्ता अत्यंत महत्वपूर्ण है। नीचे प्रमुख परीक्षाओं के आधिकारिक गति व सटीकता मानक दिए गए हैं:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {EXAM_BENCHMARKS.map((item) => (
                <div key={item.exam} className="p-4 rounded-xl border border-border/70 bg-sub-alt/15 flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-foreground text-sm">{item.exam}</span>
                    <span className="text-xs font-mono font-bold text-accent px-2 py-0.5 rounded bg-accent/10 border border-accent/20">
                      {item.speed}
                    </span>
                  </div>
                  <p className="text-xs text-sub leading-relaxed">{item.description}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Section: Practice Tips */}
          <section className="flex flex-col gap-4">
            <div className="flex items-center gap-2.5">
              <BookOpen className="h-5 w-5 text-accent shrink-0" aria-hidden="true" />
              <h2 className="font-display text-lg font-bold uppercase tracking-wider text-foreground sm:text-xl">
                हिंदी टाइपिंग में गति और सटीकता बढ़ाने के 4 स्वर्णिम नियम
              </h2>
            </div>
            <div className="space-y-3 text-sm text-sub leading-relaxed">
              <p>
                <strong>1. कीबोर्ड की ओर न देखें (Touch Typing Technique):</strong> दोनों हाथों की तर्जनी उंगलियों को क्रमशः &lsquo;F&rsquo; और &lsquo;J&rsquo; की-बम्प्स (Home Row) पर स्थिर रखें। इनस्क्रिप्ट में &lsquo;F&rsquo; पर &lsquo;ि&rsquo; की मात्रा और &lsquo;J&rsquo; पर &lsquo;र&rsquo; होता है। उंगलियों को होम रो से ही ऊपर-नीचे गति करने का अभ्यास करें।
              </p>
              <p>
                <strong>2. गति से अधिक शुद्धता (Accuracy First) को प्राथमिकता दें:</strong> यदि आप 35 WPM की गति से टाइप कर रहे हैं लेकिन अशुद्धता 10% से अधिक है, तो वास्तविक परीक्षाओं में भारी पेनल्टी के कारण आपकी नेट स्पीड 20 WPM से भी नीचे गिर जाएगी। आरंभ में 95%+ शुद्धता बनाए रखने पर ध्यान केंद्रित करें।
              </p>
              <p>
                <strong>3. लय और ताल (Rhythm & Flow):</strong> अक्षरों को झटके से टाइप करने के स्थान पर एक समान तालमेल बनाए रखें। हीरो टाइपिंग का लाइव पेस केयरट (Ghost Caret) आपको एक सुसंगत लय में टाइप करने में सहायता करता है।
              </p>
              <p>
                <strong>4. बैकस्पेस का संयमित उपयोग:</strong> परीक्षाओं में बार-बार बैकस्पेस दबाने से आपका रिफ्लेक्स समय बर्बाद होता है। प्रतिदिन 15-20 मिनट बिना बैकस्पेस का सहारा लिए टाइप करने का अभ्यास करें।
              </p>
            </div>
          </section>

          {/* Section: FAQs */}
          <section className="flex flex-col gap-4">
            <div className="flex items-center gap-2.5">
              <HelpCircle className="h-5 w-5 text-accent shrink-0" aria-hidden="true" />
              <h2 className="font-display text-lg font-bold uppercase tracking-wider text-foreground sm:text-xl">
                अक्सर पूछे जाने वाले प्रश्न (Frequently Asked Questions)
              </h2>
            </div>
            <div className="space-y-3">
              {HINDI_FAQS.map((faq) => (
                <div key={faq.question} className="p-4 rounded-xl border border-border/70 bg-sub-alt/15 flex flex-col gap-2">
                  <h3 className="font-semibold text-foreground text-sm sm:text-base">
                    {faq.question}
                  </h3>
                  <p className="text-xs sm:text-[13px] text-sub leading-relaxed whitespace-pre-line">
                    {faq.answer}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* Section: Related Internal Links */}
          <section className="border-t border-border/70 pt-8 flex flex-col gap-3">
            <h3 className="font-display text-xs sm:text-sm font-bold uppercase tracking-wider text-foreground">
              संबंधित हिंदी टाइपिंग संसाधन एवं टूल्स
            </h3>
            <div className="flex flex-wrap gap-2.5">
              <Link
                href="/guides/hindi-typing-test-and-practice"
                className="px-3 py-1.5 rounded-lg border border-border/70 bg-sub-alt/15 hover:border-accent text-xs font-medium text-foreground transition-all hover:text-accent"
              >
                विस्तृत हिंदी टाइपिंग परीक्षा गाइड
              </Link>
              <Link
                href="/typing-test/custom-text"
                className="px-3 py-1.5 rounded-lg border border-border/70 bg-sub-alt/15 hover:border-accent text-xs font-medium text-foreground transition-all hover:text-accent"
              >
                कस्टम टेक्स्ट (परीक्षा पैराग्राफ मोड)
              </Link>
              <Link
                href="/practice/accuracy"
                className="px-3 py-1.5 rounded-lg border border-border/70 bg-sub-alt/15 hover:border-accent text-xs font-medium text-foreground transition-all hover:text-accent"
              >
                सटीकता एवं एक्यूरेसी ट्रेनर
              </Link>
              <Link
                href="/typing-test/1-minute"
                className="px-3 py-1.5 rounded-lg border border-border/70 bg-sub-alt/15 hover:border-accent text-xs font-medium text-foreground transition-all hover:text-accent"
              >
                1-Minute Speed Test
              </Link>
            </div>
          </section>
        </article>
      </div>
    </div>
  );
}