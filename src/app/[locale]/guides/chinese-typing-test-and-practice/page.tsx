import type { Metadata } from "next";
import Link from "next/link";
import { GuideLayout } from "@/components/content/guide-layout";
import { SourceList } from "@/components/content/source-list";
import { Callout } from "@/components/content/callout";
import { FaqSection } from "@/components/content/faq-section";
import { buildArticleSchema } from "@/lib/seo/json-ld";
import { pageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = pageMetadata({
  title: "Chinese Typing Test: 中文打字测试与练习",
  description:
    "全面解析中文打字测速：拼音输入法盲打标准指法、全拼与双拼对比、每分钟字数标准（CPM 字/分）、候选词提速技巧与办公室文员考试要求。",
  path: "/guides/chinese-typing-test-and-practice",
});

const PUBLISHED = "2026-10-13";
const UPDATED = "2026-10-13";

const BEISPIELE_ZH = [
  {
    level: "初级入门段落 (30–50 字/分 目标)",
    note: "常用高频单字与双字词，拼音拼读简单，句式平实顺畅。",
    text: "清晨的阳光透过窗户洒在桌面上。窗外微风吹拂着绿色的树叶，公园里有许多人在安静地散步与阅读。",
  },
  {
    level: "中级进阶散文 (60–90 字/分 目标)",
    note: "成语、多音字、逗号与句号搭配，需要连词成句输入以提升选词命中率。",
    text: "尽管过去一年的市场环境经历了前所未有的剧烈波动，但研发团队凭借扎实的技术积累与敏锐的洞察力，成功推出了一套高效稳定的解决方案，赢得了用户的广泛赞誉与信任。",
  },
  {
    level: "高级文书与公文标准 (100–140+ 字/分 目标)",
    note: "政策公文术语、数字编号、顿号、破折号及书名号，考验键盘复杂符号定位。",
    text: "在企事业单位办公文员评测与行业打字技能认证中，通常建议汉字录入速度达到 60–80 字/分以上且正确率不低于 98%，更须熟练运用各类标点符号与格式排版，以满足公文起草与日常行政的高效需求！",
  },
];

const SPEED_BENCHMARKS_ZH = [
  { rank: "打字新手 / 键盘寻键者", cpm: "20–40 字/分", context: "低头看键盘，以“一指禅”或少数手指点击拼音字母。" },
  { rank: "日常办公 / 电脑使用者", cpm: "50–70 字/分", context: "能熟练收发邮件、处理文档、参与聊天，基本建立肌肉记忆。" },
  { rank: "专业文员 / 秘书岗位", cpm: "80–110 字/分", context: "企业行政、会议速记草稿、客服处理高并发咨询的标准及格线。" },
  { rank: "双拼高手 / 专业打字员", cpm: "120–160+ 字/分", context: "掌握小鹤双拼或自然码，词库高度吻合，能与口述语速基本同步。" },
  { rank: "极速速记 / 职业纪录", cpm: "180–220+ 字/分", context: "专业速录机操作员、职业输入法竞技选手。" },
];

const FAQ_ITEMS = [
  {
    question: "中文打字速度为什么使用“字/分”(CPM) 而不是英文的 WPM？",
    answer:
      "英文属于拼音文字，单词长度不一，国际标准将5个字母键位折算为一个标准词（WPM）。而汉字是意音文字，每一个方块汉字都是一个独立的语义单位。因此，中文打字速度国际与国内公认的标准是“每分钟录入汉字字数”（Characters Per Minute，简称 CPM 或 字/分）。在中文测试中，100 CPM 即代表在一分钟内成功录入100个汉字。",
    plainAnswer:
      "汉字每个字都是独立单位，因此中文打字公认采用“字/分”(CPM) 衡量，100 CPM 即每分钟100个汉字。",
  },
  {
    question: "双拼输入法真的比全拼打字更快吗？",
    answer:
      "是的。在全拼输入法中，输入一个汉字平均需要 3 到 4 个英文字母按键（例如“庄”需要输入 zhuang 共6键）。而在双拼方案（如小鹤双拼、微软双拼、搜狗双拼）中，每个汉字的声母和韵母分别对应键盘上的一个固定键位，无论汉字多复杂，都严格只需敲击 2 个键。长期练习双拼能减少约 40% 的手指敲击次数，显著减轻手部疲劳并突破 120 字/分瓶颈。",
    plainAnswer:
      "是的，双拼将声母和韵母固定为各敲击一次（固定两键一字），比全拼节省约40%的敲键量。",
  },
  {
    question: "如何解决拼音打字中频繁“翻页选词”拖慢速度的问题？",
    answer:
      "提升打字速度的核心技巧在于“以词组和整句为单位输入”，而不是一个字一个字地敲拼音。现代输入法拥有强大的神经网络语义预测模型，输入四字成语或完整句子时，首选词正确率高达 95% 以上，绝大多数时候只需敲击空格即可直接上屏，从而彻底省去寻找候选词和翻页的时间。",
    plainAnswer:
      "连词成句输入而不是单字拼读，善用输入法的长句预测让首选词直接空格上屏。",
  },
  {
    question: "在 HeroTyping 进行中文打字测试有什么特别优势？",
    answer:
      "HeroTyping 的打字引擎深度支持中文输入法（IME）的组合键预览状态（Composition Session）。当您输入拼音尚未敲击空格选择汉字时，系统不会误判为输入错误；一旦汉字确认上屏，系统会瞬间根据 Unicode 字形精准核对正确率与速度，且完全无广告弹窗干扰。",
    plainAnswer:
      "支持输入法候选栏无损预览，精准计算字/分与正确率，无广告且免登录。",
  },
];

export default function ChineseTypingTestPage() {
  const schema = buildArticleSchema({
    headline: "中文打字速度测试与拼音盲打练习指南 (CPM 字/分)",
    description:
      "中文打字测速全攻略：拼音输入法盲打指法、双拼与全拼对比、每分钟字数标准、候选词提速与文员岗位要求。",
    path: "/guides/chinese-typing-test-and-practice",
    datePublished: PUBLISHED,
    inLanguage: "zh-Hans",
  });

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <GuideLayout
        lang="zh-Hans"
        title="中文打字速度测试与拼音盲打练习"
        subtitle="掌握现代汉字极速录入技巧：拼音盲打指法分工、双拼与全拼速度差异、每分钟字数（CPM）评级标准及输入法候选词加速方法。"
        breadcrumbItems={[
          { name: "Guides", path: "/guides" },
          { name: "中文打字测速与拼音练习", path: "/guides/chinese-typing-test-and-practice" },
        ]}
        toc={[
          { id: "what-is-chinese-typing", label: "中文打字测速原理" },
          { id: "finger-placement", label: "键盘盲打指法标准" },
          { id: "quanpin-vs-shuangpin", label: "全拼 vs. 双拼对比" },
          { id: "candidate-tips", label: "选词与上屏提速技巧" },
          { id: "speed-standards", label: "打字速度分级标准" },
          { id: "practice-articles", label: "分级实战练习文本" },
          { id: "ime-mechanics", label: "IME 架构与候选词机制" },
          { id: "input-methods-comparison", label: "全拼/双拼/五笔方案对比" },
          { id: "fullwidth-punctuation", label: "全角标点符号输入规范" },
          { id: "online-test", label: "如何在 HeroTyping 测速" },
        ]}
        hasFaq
      >
        <Callout label="核心要点">
          <p>
            中文打字测试以 <strong>每分钟录入汉字数（CPM / 字/分）</strong> 和 <strong>正确率（%）</strong> 为核心评价指标。
            提升中文输入效率的关键是建立 <strong>十指盲打肌肉记忆</strong>、养成 <strong>整词整句连打</strong> 的习惯，
            并熟练使用空格键秒级上屏，避免逐字拼读带来的选词停顿。
          </p>
        </Callout>

        <p>
          在数字化信息时代，中文打字不仅是文职人员、软件工程师、文字创作者的日常工作基础，更是各类公务员考录、
          事业单位招聘和全国计算机等级考试（NCRE）中的硬性考核指标。从低头看键盘的“二指禅”跃升为行云流水的盲打高手，
          遵循科学的练习方法能让您在数周内将输入速度翻倍。
        </p>

        <h2 id="what-is-chinese-typing">中文打字测速的原理与指标</h2>
        <p>
          与英文直接键入字符不同，中文打字依赖于输入法编辑器（IME），通过将英文字母映射为拼音或字根，再从候选词列表中挑选出目标汉字：
        </p>
        <ul>
          <li>
            <strong>字/分 (CPM - Characters Per Minute)：</strong> 每分钟成功确认上屏的汉字与全角中文标点符号数量。
            了解国际公认换算机制，请参阅我们的{" "}
            <Link href="/guides/wpm-cpm-kph-calculator">WPM 与 CPM 换算计算器指南</Link>。
          </li>
          <li>
            <strong>正确率 (%)：</strong> 上屏汉字中无错字、无遗漏字的比率。在正规考核中，正确率通常要求达到 96% 至 98% 以上。
            频繁使用退格键（Backspace）纠错是导致整体输入速度断崖式下跌的最主要诱因。
          </li>
          <li>
            <strong>节奏一致性 (Consistency)：</strong> 打字过程中按键间隔时间的平稳度。节奏稳定的打字者即便峰值速度不高，
            在5分钟以上的长文本输入中其综合成绩往往远胜忽快忽慢的爆发型测试者。
          </li>
        </ul>

        <h2 id="finger-placement">键盘盲打指法标准（十指分工）</h2>
        <p>
          盲打（Touch Typing）是突破打字速度瓶颈的第一道门槛。如果您的视线总是在屏幕与键盘之间来回切换，速度绝难突破 60 字/分：
        </p>
        <ul>
          <li>
            <strong>基准键位 (Home Row)：</strong> 左手食指、中指、无名指、小指分别轻放在 <strong>A – S – D – F</strong>；
            右手食指、中指、无名指、小指分别轻放在 <strong>J – K – L – ;</strong>。
            食指依靠触觉感受 <strong>F</strong> 与 <strong>J</strong> 键上的凸起横线，无需用眼即可瞬间归位。
            详见图解：<Link href="/guides/touch-typing-finger-map">触觉定位指法分布图</Link>。
          </li>
          <li>
            <strong>大拇指分工：</strong> 双手大拇指悬于空格键（Spacebar）上方。习惯用右手的大拇指负责敲击空格确认候选词，
            保证敲击回弹迅捷。
          </li>
        </ul>

        <h2 id="quanpin-vs-shuangpin">全拼输入法 vs. 双拼输入法：进阶提速之路</h2>
        <p>
          对于希望冲击 100+ 字/分甚至 150+ 字/分的进阶打字爱好者，输入法架构的选择至关重要：
        </p>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-border text-sub font-mono uppercase">
                <th className="py-2.5 pr-4">特性对比</th>
                <th className="py-2.5 pr-4">全拼输入法 (Quanpin)</th>
                <th className="py-2.5">双拼输入法 (Shuangpin - 如小鹤/微软)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              <tr className="hover:bg-sub-alt/20">
                <td className="py-2.5 pr-4 font-semibold text-foreground">单字击键次数</td>
                <td className="py-2.5 pr-4 text-foreground/80">变长：1 到 6 次击键（平均约 3.5 次）</td>
                <td className="py-2.5 text-accent font-semibold">固定：无论汉字多复杂，恒定敲击 2 次</td>
              </tr>
              <tr className="hover:bg-sub-alt/20">
                <td className="py-2.5 pr-4 font-semibold text-foreground">学习曲线</td>
                <td className="py-2.5 pr-4 text-foreground/90">零学习成本，只要懂汉语拼音即可直接使用</td>
                <td className="py-2.5 text-foreground/80">需要 3–7 天牢记韵母键位映射，之后速度飞跃</td>
              </tr>
              <tr className="hover:bg-sub-alt/20">
                <td className="py-2.5 pr-4 font-semibold text-foreground">手指疲劳度</td>
                <td className="py-2.5 pr-4 text-foreground/80">击键频次高，长时间录入容易手指酸痛</td>
                <td className="py-2.5 text-accent font-semibold">击键总量减少约 40%，极度护手防劳损</td>
              </tr>
            </tbody>
          </table>
        </div>

        <h2 id="candidate-tips">拼音输入法候选词与上屏提速核心技巧</h2>
        <p>
          打字慢往往不是因为手指按键慢，而是因为大脑在“选词翻页”上浪费了过多的认知反应时间：
        </p>
        <ol className="list-decimal space-y-2 pl-5 text-foreground/90">
          <li>
            <strong>词组整句连打：</strong> 绝不要一个字一个字地敲拼音。输入“人工智能”请直接键入 <code>rengongzhineng</code> 然后按空格，
            现代智能输入法会将完整词组排在第一候选位。
          </li>
          <li>
            <strong>熟练盲打常用标点：</strong> 逗号、句号、顿号（键盘上的反斜杠 <code>\</code>）、问号与书名号必须做到不看键盘盲打。
          </li>
          <li>
            <strong>善用简拼首字母：</strong> 对于长短语或熟练成语，输入各字声母即可（例如输入 <code>zghrghg</code> 即可直接得到“中华人民共和国”）。
          </li>
        </ol>

        <h2 id="speed-standards">中文打字速度能力分级标准 (CPM)</h2>
        <p>
          您的汉字录入速度处于哪一梯队？请参考国内主流行业与教育机构的定级标准：
        </p>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-border text-sub font-mono uppercase">
                <th className="py-2.5 pr-4">水平等级</th>
                <th className="py-2.5 pr-4">速度范围 (字/分)</th>
                <th className="py-2.5">对应能力与职业场景</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {SPEED_BENCHMARKS_ZH.map((b) => (
                <tr key={b.rank} className="hover:bg-sub-alt/20">
                  <td className="py-2.5 pr-4 font-semibold text-foreground">{b.rank}</td>
                  <td className="py-2.5 pr-4 font-mono text-accent">{b.cpm}</td>
                  <td className="py-2.5 text-foreground/80">{b.context}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs text-sub">
          更多全球用户横向对比数据，请查阅我们的{" "}
          <Link href="/guides/average-typing-speed">全球平均打字速度统计报告</Link>。
        </p>

        <h2 id="practice-articles">分级实战练习文本</h2>
        <p>
          阅读并尝试在打字软件中连贯录入以下精选文本段落：
        </p>
        <div className="flex flex-col gap-3.5">
          {BEISPIELE_ZH.map((b) => (
            <div key={b.level} className="theme-transition rounded-xl border border-border bg-sub-alt/20 p-4">
              <p className="font-mono text-xs font-semibold uppercase tracking-wider text-accent">
                {b.level}
              </p>
              <p className="mt-1 text-xs text-sub/80">{b.note}</p>
              <p className="mt-2 text-sm leading-relaxed text-foreground font-mono bg-bg/50 p-2.5 rounded-lg border border-border/40">
                {b.text}
              </p>
            </div>
          ))}
        </div>

        <h2 id="ime-mechanics">Input Method Editor (IME) 架构与候选词机制</h2>
        <p>
          在中文打字中，按键输入并不直接对应屏幕文字，而是通过输入法引擎（Input Method Editor，简称 IME）进行转换。这一过程包含三个阶段：
        </p>
        <ul className="list-disc space-y-2 pl-5 text-foreground/90">
          <li>
            <strong>字母缓冲捕获 (Composition Buffer):</strong> 当您敲击字母如 <code>z-h-o-n-g</code> 时，键盘事件首先被 IME 拦截并保存在预编辑缓冲区中，屏幕上显示带下划线的拼音字母。在此阶段，打字软件不应将未完成的拼音误判为拼写错误。
          </li>
          <li>
            <strong>词频模型预测 (Candidate Generation):</strong> 现代输入法内置庞大的 n-gram 语言模型与云端词库，根据上下文语境动态推导最可能的汉字或词组，并将其置于候选栏第一位（首选词）。
          </li>
          <li>
            <strong>上屏确认提交 (Commit Session):</strong> 敲击空格键或标点符号时，选定的汉字字符被正式提交给操作系统，并触发 <code>compositionend</code> 事件。只有此时，打字测速引擎才会精确比对 Unicode 汉字字符与目标段落的吻合度。
          </li>
        </ul>

        <h2 id="input-methods-comparison">全拼、双拼与五笔字型方案深度对比</h2>
        <p>
          选择适合自己的输入法方案是突破中文打字速度上限的关键。以下是三大主流中文录入方案的综合对比：
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse border border-border">
            <thead>
              <tr className="bg-sub-alt/40 border-b border-border">
                <th className="p-3 font-semibold text-foreground">输入法类型</th>
                <th className="p-3 font-semibold text-foreground">平均击键/字</th>
                <th className="p-3 font-semibold text-foreground">学习难度</th>
                <th className="p-3 font-semibold text-foreground">极限速度潜力</th>
                <th className="p-3 font-semibold text-foreground">最适应用人群</th>
              </tr>
            </thead>
            <tbody className="divide-y border-border text-xs">
              <tr className="hover:bg-sub-alt/20">
                <td className="p-3 font-medium text-foreground">全拼 (Quanpin)</td>
                <td className="p-3 text-foreground/85">3.2 – 4.5 键</td>
                <td className="p-3 text-emerald-400">极低 (掌握拼音即用)</td>
                <td className="p-3 text-foreground/85">80 – 110 字/分</td>
                <td className="p-3 text-foreground/85">日常办公、聊天、学生与入门者</td>
              </tr>
              <tr className="hover:bg-sub-alt/20">
                <td className="p-3 font-medium text-foreground">双拼 (Shuangpin)</td>
                <td className="p-3 text-foreground/85">固定 2.0 键</td>
                <td className="p-3 text-amber-400">中等 (需记忆键位图 3–5 天)</td>
                <td className="p-3 text-emerald-400">120 – 160+ 字/分</td>
                <td className="p-3 text-foreground/85">程序员、文案策划、追求高效率白领</td>
              </tr>
              <tr className="hover:bg-sub-alt/20">
                <td className="p-3 font-medium text-foreground">五笔字型 (Wubi)</td>
                <td className="p-3 text-foreground/85">1.8 – 2.5 键 (无重码)</td>
                <td className="p-3 text-rose-400">极高 (需熟背字根表与拆字规则)</td>
                <td className="p-3 text-emerald-400">140 – 180+ 字/分</td>
                <td className="p-3 text-foreground/85">专业速记员、法院文书、档案录入人员</td>
              </tr>
            </tbody>
          </table>
        </div>

        <h2 id="fullwidth-punctuation">全角标点符号输入规范与指法技巧</h2>
        <p>
          中文排版采用“全角字符”，即标点符号占用一个完整汉字宽度。在专业文员打字评测中，标点符号录入错误或混用半角英文标点属于严重扣分项。以下为核心符号键位映射：
        </p>
        <ul className="list-disc space-y-2 pl-5 text-foreground/90">
          <li>
            <strong>顿号（、）：</strong> 按键盘回车键上方的反斜杠键 <code>\</code>。左手小指或右手小指迅速点击，无需按 Shift。
          </li>
          <li>
            <strong>书名号（《 》）：</strong> 左手小指按住左 Shift，右手无名指与中指分别点击 <code>&lt;</code> (逗号键) 与 <code>&gt;</code> (句号键)。
          </li>
          <li>
            <strong>省略号（……）：</strong> 左手小指按住 Shift，右手食指向上伸展敲击主键盘数字键 <code>6</code>（即 <code>Shift + 6</code>），输入法会自动转换为标准六点省略号。
          </li>
          <li>
            <strong>破折号（——）：</strong> 按住 Shift 并点击减号键 <code>-</code>（即 <code>Shift + -</code>），连续输入两次即可生成标准中文双字宽破折号。
          </li>
        </ul>

        <h2 id="hsk-and-international-standards">HSK 国际中文能力与国际汉字录入测评标准</h2>
        <p>
          对于学习中文作为第二语言（Chinese as a Second Language, CSL）的学习者与国际从业者，中文打字是 HSK 考试机考与商务汉语应用的重要基本功：
        </p>
        <ul className="list-disc space-y-2 pl-5 text-foreground/90">
          <li>
            <strong>HSK 3–4 级机考要求 (HSK 3–4 Computer-Based Test):</strong> 建议录入速度达到 25–40 CPM (Characters Per Minute)，能够准确拼写 600–1200 个常用核心词汇，正确使用全角逗号与句号。
          </li>
          <li>
            <strong>HSK 5–6 级与商务汉语 (Advanced Business Chinese):</strong> 建议录入速度稳定在 50–70 CPM 以上，能够连词成句快速输入学术论文论点、商务合同与电子邮件，正确率维持在 96% 以上。
          </li>
          <li>
            <strong>跨国企业双语工作流 (Bilingual Workflow in Global Tech):</strong> 在使用 Slack、Notion、GitHub 等现代协同工具时，掌握中英文无缝切换热键（如单击 <code>Shift</code> 或 <code>Caps Lock</code> 切换中英文模式）可大幅避免输入法死锁与标点格式错乱。
          </li>
        </ul>

        <h2 id="ime-ecosystem">主流输入法引擎选择与优化配置建议</h2>
        <p>
          现代电脑与移动端有数款成熟优秀的输入法可供选择：
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl border border-border bg-sub-alt/20">
            <h3 className="text-sm font-semibold text-foreground">微软拼音 (Microsoft Pinyin)</h3>
            <p className="mt-1 text-xs text-sub leading-relaxed">
              Windows 10/11 原生内置，极简无广告弹窗，资源占用极低。支持动态长句预测、U 模式笔画输入（遇生僻字可按 u + 笔画）与 V 模式计算器。
            </p>
          </div>
          <div className="p-4 rounded-xl border border-border bg-sub-alt/20">
            <h3 className="text-sm font-semibold text-foreground">搜狗拼音 / 百度输入法 (Sogou / Baidu)</h3>
            <p className="mt-1 text-xs text-sub leading-relaxed">
              行业最大的互联网云词库，热词与网络新词同步最快。适合自媒体创作者与高频流行语交流，建议在设置中关闭联想广告推荐以保持纯净。
            </p>
          </div>
          <div className="p-4 rounded-xl border border-border bg-sub-alt/20">
            <h3 className="text-sm font-semibold text-foreground">Rime 中州韵输入法引擎 (Rime Input Engine)</h3>
            <p className="mt-1 text-xs text-sub leading-relaxed">
              开源、隐私保护最强、极客与程序员首选。支持纯本地配置、小鹤双拼、地球拼音（带声调）与自定义词库，完全不上传任何键盘输入数据。
            </p>
          </div>
          <div className="p-4 rounded-xl border border-border bg-sub-alt/20">
            <h3 className="text-sm font-semibold text-foreground">macOS 原生简体拼音 (Apple Native Pinyin)</h3>
            <p className="mt-1 text-xs text-sub leading-relaxed">
              系统深度集成，支持触控板手写轨迹与多设备 iCloud 词库同步。在 Safari 与原生应用中反应极其平滑，排版字符兼容性极佳。
            </p>
          </div>
        </div>

        <h2 id="online-test">如何在 HeroTyping 上进行中文打字测速</h2>
        <p>
          HeroTyping 提供专业纯净的中文打字练习环境：
        </p>
        <ol className="list-decimal space-y-2 pl-5 text-foreground/90">
          <li>
            <strong>一键启动在线中文打字测试：</strong> 点击访问{" "}
            <Link href="/chinese-typing-test">HeroTyping 中文在线打字测速页面</Link>，系统将自动载入高频常用汉字与句子题库。
          </li>
          <li>
            <strong>使用自定义文本模考：</strong> 将您要准备的公文、小说或工作汇报内容复制进{" "}
            <Link href="/typing-test/custom-text">自定义文本打字测试工具</Link>，进行针对性训练。
          </li>
          <li>
            <strong>掌握打字节奏感：</strong> 开启幽灵指针功能（<Link href="/guides/improve-typing-speed-with-ghost-caret">Ghost Caret 测速配速指南</Link>），
            设定每分钟 80 字目标速度引导视线前瞻。
          </li>
          <li>
            <strong>定时拉伸放松：</strong> 长时间伏案打字容易导致腕管综合征，建议每30分钟参考{" "}
            <Link href="/guides/typing-stretches-and-hand-warmups">手部肌腱放松与拉伸操</Link> 休息2分钟。
          </li>
        </ol>

        <FaqSection items={FAQ_ITEMS} />

        <p className="text-xs text-sub">最后更新时间：{UPDATED}。</p>
      
        <SourceList
          sources={[
          {
                    "label": "National Standard of the People's Republic of China (GB/T 18030-2022) — \"Information technology — Chinese coded character set\"",
                    "href": "https://openstd.samr.gov.cn/"
          },
          {
                    "label": "Ministry of Education of the People's Republic of China / State Language Commission — \"General Standard Chinese Character Table\"",
                    "href": "http://www.moe.gov.cn/"
          }
]}
        />

      </GuideLayout>
    </>
  );
}
