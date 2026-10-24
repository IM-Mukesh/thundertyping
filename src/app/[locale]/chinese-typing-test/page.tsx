import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { TypingTestClient } from "@/components/typing-test/typing-test-client";
import { getBundledTypingContent } from "@/lib/typing-engine/typing-content";
import { buildWebApplicationSchema, buildFaqSchema } from "@/lib/seo/json-ld";
import { SITE_NAME, SITE_URL } from "@/lib/seo/constants";
import { Keyboard, Award, CheckCircle2, BookOpen, Sparkles, HelpCircle } from "lucide-react";

export async function generateMetadata(): Promise<Metadata> {
  const title = `中文在线打字测速与练习: Chinese Typing Test (拼音打字测试) | ${SITE_NAME}`;
  const description =
    "免费在线中文打字测试与测速练习。实时计算每分钟打字数 (CPM/字/分) 与准确率，支持微软拼音、搜狗拼音等主流中文输入法，精选常用现代汉语字词与经典文段。";
  const canonicalUrl = `${SITE_URL}/chinese-typing-test`;

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

const CHINESE_FAQS = [
  {
    question: "中文打字速度是如何计算的？什么是 CPM（字/分）？",
    answer:
      "英文打字通常采用以 5 个按键折算为 1 个单词的 WPM（Words Per Minute）标准。而汉字具有表意与单字独立的特点，国际与国内通用的中文打字测速标准为 CPM（Characters Per Minute，即每分钟正确输入的汉字字符数，常写作“字/分”）。净速度（Net CPM）＝（正确录入汉字总数 ÷ 测试分钟数）－ 未纠正错字扣分惩罚。",
  },
  {
    question: "拼音输入法（IME）在 HeroTyping 中如何与测速引擎配合？",
    answer:
      "HeroTyping 原生监听输入法合成事件（Composition Events）。当您在全拼或双拼输入法中键入拼音字母时，输入法处于候选状态；当您按下空格键或数字键确认上屏目标汉字时，打字引擎会瞬时进行 Unicode 字素比对，自动流转至下一词段，无需额外的多余按键。",
  },
  {
    question: "日常工作与职业考核中，中文打字速度的标准通常是多少？",
    answer:
      "根据中文录入行业统计与岗位要求：\n• 初学入门：30–45 字/分（适合日常聊天与基本沟通）\n• 熟练办公：50–70 字/分（满足常规行政、文案与技术文档撰写）\n• 专业文秘与客服：70–90 字/分（通常要求 95%+ 准确率）\n• 法院书记员与专业速录：100–140+ 字/分（听打与实时庭审记录）。",
  },
  {
    question: "在打字测试中如何快速提升中文输入准确率与速度？",
    answer:
      "最核心的技巧是“整词录入”（以双字词、四字成语为单位输入拼音，利用现代输入法的智能联想一次性上屏）而不是单字孤立输入。此外，养成盲打指法习惯，视线保持前瞻 2 到 3 个字，能显著消除打字过程中的微停顿。",
  },
];

const SPEED_BENCHMARKS = [
  {
    tier: "日常与初学阶段",
    speed: "30–50 字/分 (CPM)",
    description: "适合刚接触盲打或练习拼音拼写者，重点在于指法归位与按键熟悉。",
  },
  {
    tier: "熟练办公标准",
    speed: "50–70 字/分 (CPM)",
    description: "满足绝大多数职场日常邮件、报告编写及协同办公的高效沟通需求。",
  },
  {
    tier: "专业文案与客服",
    speed: "70–100 字/分 (CPM)",
    description: "具备极高的词库记忆与盲打肌肉记忆，键盘输入几乎与思考同步。",
  },
  {
    tier: "法院速记与速录员",
    speed: "100–140+ 字/分 (CPM)",
    description: "通常配合双拼输入法或速录机，能进行实时跟打、会议记录与听打录入。",
  },
];

export default async function ChineseTypingTestPage({
  params,
}: {
  params?: Promise<{ locale: string }>;
}) {
  const resolvedParams = params ? await params : undefined;
  const locale = resolvedParams?.locale ?? "en";

  const appSchema = buildWebApplicationSchema({
    path: "/chinese-typing-test",
    name: "中文在线打字测速 (Chinese Typing Speed Test) — HeroTyping",
    description:
      "专业的免费中文拼音打字速度测试与打字练习工具，精准测量 CPM 字/分与准确率。",
    inLanguage: "zh-Hans",
  });
  const faqSchema = buildFaqSchema(CHINESE_FAQS, "zh-Hans");
  const chineseContent = getBundledTypingContent("zh");

  const breadcrumbs = [
    { name: "Typing Test", path: "/" },
    { name: "中文打字测速 (Chinese Typing Test)", path: "/chinese-typing-test" },
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
            <span>智能 IME 拼音输入法适配 & 现代汉语常用字库</span>
          </div>
          <h1 className="font-display text-2xl font-black uppercase tracking-tight text-foreground sm:text-3xl lg:text-4xl">
            中文在线打字测速与练习 (Chinese Typing Test)
          </h1>
          <p className="mt-2.5 max-w-2xl text-sm leading-relaxed text-sub sm:text-base">
            基于高频现代汉语词库与经典文段，精准测量拼音输入法的打字速度（字/分 CPM）与汉字输入准确率。敲击第一下键盘即可开启实时测速。
          </p>
        </header>

        {/* Interactive Typing Test Tool */}
        <section aria-label="Chinese Typing Test Tool" className="w-full">
          <TypingTestClient
            locale="zh"
            localizedContent={chineseContent}
            enableTypingLanguageSelection
            initialMode="time"
            initialTimeDuration={60}
          />
        </section>

        {/* Explanatory & Educational Content */}
        <article className="mt-14 flex w-full flex-col gap-10 text-left">
          {/* Section: CPM & Scoring Engine */}
          <section className="flex flex-col gap-4">
            <div className="flex items-center gap-2.5">
              <Keyboard className="h-5 w-5 text-accent shrink-0" aria-hidden="true" />
              <h2 className="font-display text-lg font-bold uppercase tracking-wider text-foreground sm:text-xl">
                中文打字评分机制与 CPM（字/分）计算标准
              </h2>
            </div>
            <p className="text-sm leading-relaxed text-sub sm:text-base">
              在英文打字中，系统通常通过空格将字母划分为单词，并以 5 个按键折算为 1 个 WPM。而中文书写连续且无词间空格，因此采用 <strong>CPM（Characters Per Minute，即每分钟汉字字数）</strong> 作为最直观的标准衡量指标：
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              <div className="p-4 rounded-xl border border-border/70 bg-sub-alt/15 flex flex-col gap-2">
                <span className="font-semibold text-foreground text-sm flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-accent shrink-0" />
                  原生 IME 合成事件监听
                </span>
                <p className="text-xs text-sub leading-relaxed">
                  HeroTyping 完整支持微软拼音、搜狗输入法、微信输入法及各大操作系统默认中文 IME。在输入拼音字母与候选词时无冲突卡顿，汉字上屏瞬间精准核对。
                </p>
              </div>
              <div className="p-4 rounded-xl border border-border/70 bg-sub-alt/15 flex flex-col gap-2">
                <span className="font-semibold text-foreground text-sm flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-accent shrink-0" />
                  连续分词与自然间距排版
                </span>
                <p className="text-xs text-sub leading-relaxed">
                  系统采用现代化 Unicode 分词器（<code>Intl.Segmenter</code>），自动消除英文单词间的宽距空格，呈现符合现代汉语阅读习惯的连续紧凑排版。
                </p>
              </div>
            </div>
          </section>

          {/* Section: Benchmarks */}
          <section className="flex flex-col gap-4">
            <div className="flex items-center gap-2.5">
              <Award className="h-5 w-5 text-accent shrink-0" aria-hidden="true" />
              <h2 className="font-display text-lg font-bold uppercase tracking-wider text-foreground sm:text-xl">
                中文打字速度段位与职场岗位参考标准
              </h2>
            </div>
            <p className="text-sm leading-relaxed text-sub sm:text-base">
              了解不同领域的打字速度标准，能帮助您设定清晰科学的练习目标：
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {SPEED_BENCHMARKS.map((item) => (
                <div key={item.tier} className="p-4 rounded-xl border border-border/70 bg-sub-alt/15 flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-foreground text-sm">{item.tier}</span>
                    <span className="text-xs font-mono font-bold text-accent px-2 py-0.5 rounded bg-accent/10 border border-accent/20">
                      {item.speed}
                    </span>
                  </div>
                  <p className="text-xs text-sub leading-relaxed">{item.description}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Section: Practice Techniques */}
          <section className="flex flex-col gap-4">
            <div className="flex items-center gap-2.5">
              <BookOpen className="h-5 w-5 text-accent shrink-0" aria-hidden="true" />
              <h2 className="font-display text-lg font-bold uppercase tracking-wider text-foreground sm:text-xl">
                提高拼音打字速度的 4 大进阶练习法
              </h2>
            </div>
            <div className="space-y-3 text-sm text-sub leading-relaxed">
              <p>
                <strong>1. 词组与短语连打（整词录入法）：</strong> 避免“拼一字、选一字”。现代拼音输入法拥有强大的上下文联想能力，输入“zhonghuarenmingongheguo”可一次性打出“中华人民共和国”，效率相比单字输入提高数倍。
              </p>
              <p>
                <strong>2. 标准盲打指法与主键盘归位：</strong> 双手食指始终归位在 F 和 J 键凸起上。通过肌肉记忆定位字母键，彻底摆脱“低头看键盘、抬头看屏幕”的低效习惯。
              </p>
              <p>
                <strong>3. 视线超前阅读（Eye-Hand Span）：</strong> 在双手敲击当前词语时，视线应保持注视后方 2 至 3 个汉字。提前在脑海中完成拼音构词，消除打字中断停顿。
              </p>
              <p>
                <strong>4. 尝试双拼输入法提升击键效率：</strong> 如果全拼速度进入瓶颈期（约 80–90 字/分），可以尝试学习双拼方案（如小鹤双拼、自然码）。每个汉字仅需敲击 2 次按键，大幅降低手指运动疲劳。
              </p>
            </div>
          </section>

          {/* Section: FAQs */}
          <section className="flex flex-col gap-4">
            <div className="flex items-center gap-2.5">
              <HelpCircle className="h-5 w-5 text-accent shrink-0" aria-hidden="true" />
              <h2 className="font-display text-lg font-bold uppercase tracking-wider text-foreground sm:text-xl">
                常见问题解答 (Frequently Asked Questions)
              </h2>
            </div>
            <div className="space-y-3">
              {CHINESE_FAQS.map((faq) => (
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
              相关练习资源与打字工具
            </h3>
            <div className="flex flex-wrap gap-2.5">
              <Link
                href="/guides/chinese-typing-test-and-practice"
                className="px-3 py-1.5 rounded-lg border border-border/70 bg-sub-alt/15 hover:border-accent text-xs font-medium text-foreground transition-all hover:text-accent"
              >
                中文打字测速与拼音输入完整指南
              </Link>
              <Link
                href="/typing-test/custom-text"
                className="px-3 py-1.5 rounded-lg border border-border/70 bg-sub-alt/15 hover:border-accent text-xs font-medium text-foreground transition-all hover:text-accent"
              >
                自定义文章录入测试
              </Link>
              <Link
                href="/practice/accuracy"
                className="px-3 py-1.5 rounded-lg border border-border/70 bg-sub-alt/15 hover:border-accent text-xs font-medium text-foreground transition-all hover:text-accent"
              >
                准确率专项强化训练
              </Link>
              <Link
                href="/typing-test/1-minute"
                className="px-3 py-1.5 rounded-lg border border-border/70 bg-sub-alt/15 hover:border-accent text-xs font-medium text-foreground transition-all hover:text-accent"
              >
                1分钟经典打字测试
              </Link>
            </div>
          </section>
        </article>
      </div>
    </div>
  );
}