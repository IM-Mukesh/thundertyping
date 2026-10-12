import { ENGLISH_QUOTES } from "@/data/quotes/english-quotes";
import { ENGLISH_WORDS } from "@/data/words/english-1k";
import { AVAILABLE_LOCALES, isValidTypingLocale, type Locale, type TypingLocale } from "@/lib/i18n/config";
import type { LocalizedContent } from "@/lib/typing-engine/engine-types";
import { VOCAB_WORDS } from "@/lib/vocabulary/vocabulary-words";

export function isAvailableTypingLanguage(value: string): value is Locale {
  return isValidTypingLocale(value) && AVAILABLE_LOCALES.includes(value);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isText(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

/*
 * Every selectable typing language has a local pack. Keeping all three
 * vocabulary tiers and all quote lengths here means every test mode works
 * offline without a server content dependency.
 */
const BUNDLED_TYPING_CONTENT: Record<TypingLocale, LocalizedContent> = {
  en: {
    commonWords: ENGLISH_WORDS,
    vocab: VOCAB_WORDS,
    quotes: ENGLISH_QUOTES,
  },

  es: {
    commonWords: [
      "hola", "casa", "hoy", "mañana", "pequeño", "aprender", "rápido", "amigo",
      "trabajo", "agua", "leer", "escribir", "teclado", "práctica", "tiempo", "vida",
      "pregunta", "respuesta", "importante", "correcto", "juntos", "fuerte", "mejor", "tranquilo",
      "mundo", "palabra", "camino", "luz", "feliz", "gracias",
    ],
    vocab: {
      easy: [
        { word: "casa", pos: "sustantivo", definition: "lugar donde vive una persona" },
        { word: "gato", pos: "sustantivo", definition: "animal doméstico pequeño" },
        { word: "perro", pos: "sustantivo", definition: "animal doméstico que suele ladrar" },
        { word: "árbol", pos: "sustantivo", definition: "planta grande con tronco y ramas" },
        { word: "agua", pos: "sustantivo", definition: "líquido transparente que necesitamos beber" },
        { word: "amigo", pos: "sustantivo", definition: "persona con la que existe confianza y cariño" },
        { word: "libro", pos: "sustantivo", definition: "conjunto de páginas escritas o impresas" },
        { word: "sol", pos: "sustantivo", definition: "estrella que ilumina la Tierra" },
      ],
      medium: [
        { word: "sorpresa", pos: "sustantivo", definition: "acontecimiento inesperado" },
        { word: "pensamiento", pos: "sustantivo", definition: "idea formada en la mente" },
        { word: "herramienta", pos: "sustantivo", definition: "objeto que ayuda a realizar una tarea" },
        { word: "progreso", pos: "sustantivo", definition: "mejora gradual de una situación" },
        { word: "costumbre", pos: "sustantivo", definition: "forma habitual de comportarse" },
        { word: "atención", pos: "sustantivo", definition: "concentración consciente en algo" },
        { word: "confianza", pos: "sustantivo", definition: "seguridad que se tiene en alguien o algo" },
        { word: "velocidad", pos: "sustantivo", definition: "rapidez con la que se mueve algo" },
      ],
      hard: [
        { word: "responsabilidad", pos: "sustantivo", definition: "obligación de responder por los propios actos" },
        { word: "probabilidad", pos: "sustantivo", definition: "posibilidad de que ocurra un acontecimiento" },
        { word: "independencia", pos: "sustantivo", definition: "libertad para actuar sin control ajeno" },
        { word: "perseverancia", pos: "sustantivo", definition: "constancia para continuar ante las dificultades" },
        { word: "extraordinario", pos: "adjetivo", definition: "fuera de lo común o habitual" },
        { word: "conocimiento", pos: "sustantivo", definition: "información comprendida por una persona" },
        { word: "colaboración", pos: "sustantivo", definition: "trabajo conjunto para lograr un objetivo" },
        { word: "creatividad", pos: "sustantivo", definition: "capacidad de producir ideas nuevas" },
      ],
    },
    quotes: [
      { id: "bundled-es-1", text: "La práctica hace al maestro.", source: "Dicho popular", length: "short" },
      { id: "bundled-es-2", text: "Querer es poder.", source: "Proverbio", length: "short" },
      { id: "bundled-es-3", text: "El comienzo es la mitad de todo.", source: "Aristóteles", length: "short" },
      { id: "bundled-es-4", text: "El éxito nace de la constancia y del esfuerzo diario.", source: "Dicho popular", length: "medium" },
      { id: "bundled-es-5", text: "Aprender algo nuevo cada día mantiene despierta la curiosidad.", source: "Reflexión popular", length: "medium" },
      { id: "bundled-es-6", text: "Los grandes cambios empiezan con una decisión pequeña y valiente.", source: "Reflexión popular", length: "long" },
    ],
  },

  hi: {
    commonWords: [
      "नमस्ते", "घर", "आज", "कल", "छोटा", "सीखना", "तेज़", "दोस्त", "काम", "पानी",
      "पढ़ना", "लिखना", "कुंजीपटल", "अभ्यास", "समय", "जीवन", "प्रश्न", "उत्तर", "महत्वपूर्ण", "सही",
      "साथ", "मज़बूत", "बेहतर", "शांत", "दुनिया", "शब्द", "रास्ता", "प्रकाश", "खुश", "धन्यवाद",
    ],
    vocab: {
      easy: [
        { word: "घर", pos: "संज्ञा", definition: "रहने की जगह" },
        { word: "बिल्ली", pos: "संज्ञा", definition: "एक छोटा पालतू जानवर" },
        { word: "कुत्ता", pos: "संज्ञा", definition: "भौंकने वाला पालतू जानवर" },
        { word: "पेड़", pos: "संज्ञा", definition: "तने और शाखाओं वाला बड़ा पौधा" },
        { word: "पानी", pos: "संज्ञा", definition: "पीने के लिए आवश्यक तरल पदार्थ" },
        { word: "दोस्त", pos: "संज्ञा", definition: "विश्वास और स्नेह वाला व्यक्ति" },
        { word: "किताब", pos: "संज्ञा", definition: "लिखे हुए पन्नों का संग्रह" },
        { word: "सूरज", pos: "संज्ञा", definition: "पृथ्वी को रोशनी देने वाला तारा" },
      ],
      medium: [
        { word: "आश्चर्य", pos: "संज्ञा", definition: "अचानक होने वाली अनपेक्षित बात" },
        { word: "विचार", pos: "संज्ञा", definition: "मन में बनी हुई सोच" },
        { word: "उपकरण", pos: "संज्ञा", definition: "किसी काम में सहायता देने वाली वस्तु" },
        { word: "प्रगति", pos: "संज्ञा", definition: "धीरे-धीरे होने वाला सुधार" },
        { word: "आदत", pos: "संज्ञा", definition: "बार-बार दोहराया जाने वाला व्यवहार" },
        { word: "ध्यान", pos: "संज्ञा", definition: "किसी विषय पर मन की एकाग्रता" },
        { word: "विश्वसनीयता", pos: "संज्ञा", definition: "भरोसा करने योग्य होने का गुण" },
        { word: "गति", pos: "संज्ञा", definition: "किसी वस्तु के चलने की तेजी" },
      ],
      hard: [
        { word: "उत्तरदायित्व", pos: "संज्ञा", definition: "अपने कार्यों के लिए जवाबदेह होने का दायित्व" },
        { word: "संभावना", pos: "संज्ञा", definition: "किसी घटना के होने की मुमकिन स्थिति" },
        { word: "स्वतंत्रता", pos: "संज्ञा", definition: "बाहरी नियंत्रण से मुक्त होने की अवस्था" },
        { word: "दृढ़निश्चय", pos: "संज्ञा", definition: "लक्ष्य पूरा करने का मजबूत संकल्प" },
        { word: "असाधारण", pos: "विशेषण", definition: "सामान्य से बहुत अलग या अनोखा" },
        { word: "ज्ञान", pos: "संज्ञा", definition: "सीखने से प्राप्त समझ और जानकारी" },
        { word: "सहयोग", pos: "संज्ञा", definition: "किसी उद्देश्य के लिए मिलकर किया गया काम" },
        { word: "रचनात्मकता", pos: "संज्ञा", definition: "नए विचार बनाने की क्षमता" },
      ],
    },
    quotes: [
      { id: "bundled-hi-1", text: "जहाँ चाह, वहाँ राह।", source: "हिंदी कहावत", length: "short" },
      { id: "bundled-hi-2", text: "कर्म ही पूजा है।", source: "लोकप्रिय कहावत", length: "short" },
      { id: "bundled-hi-3", text: "धीरे चलो, दूर तक जाओ।", source: "हिंदी कहावत", length: "short" },
      { id: "bundled-hi-4", text: "सफलता मेहनत और धैर्य से मिलती है।", source: "प्रेरक वचन", length: "medium" },
      { id: "bundled-hi-5", text: "सीखना जीवन भर चलने वाली यात्रा है।", source: "प्रेरक वचन", length: "medium" },
      { id: "bundled-hi-6", text: "छोटी-छोटी कोशिशें मिलकर बड़े बदलाव लाती हैं।", source: "प्रेरक वचन", length: "long" },
      { id: "bundled-hi-7", text: "जो व्यक्ति निरंतर अभ्यास करता है, वह कठिन काम भी सरल बना लेता है।", source: "प्रेरक वचन", length: "long" },
    ],
  },

  de: {
    commonWords: [
      "hallo", "haus", "heute", "klein", "morgen", "lernen", "schnell", "freund",
      "arbeit", "wasser", "lesen", "schreiben", "tastatur", "übung", "zeit", "leben",
      "frage", "antwort", "wichtig", "richtig", "gemeinsam", "stark", "besser", "ruhig",
    ],
    vocab: {
      easy: [
        { word: "Haus", pos: "Substantiv", definition: "Gebäude, in dem Menschen leben" },
        { word: "Katze", pos: "Substantiv", definition: "Kleines, pelziges Haustier" },
        { word: "Hund", pos: "Substantiv", definition: "Vierbeiniges Haustier, das bellt" },
        { word: "Baum", pos: "Substantiv", definition: "Große Pflanze mit einem Holzstamm" },
        { word: "Wasser", pos: "Substantiv", definition: "Klare Flüssigkeit zum Trinken" },
        { word: "Freund", pos: "Substantiv", definition: "Person, der man vertraut" },
        { word: "Buch", pos: "Substantiv", definition: "Geschriebene oder gedruckte Sammlung von Seiten" },
        { word: "Sonne", pos: "Substantiv", definition: "Stern, der die Erde beleuchtet" },
      ],
      medium: [
        { word: "Überraschung", pos: "Substantiv", definition: "Unerwartetes Ereignis" },
        { word: "Gedanke", pos: "Substantiv", definition: "Inhalt des bewussten Denkens" },
        { word: "Werkzeug", pos: "Substantiv", definition: "Hilfsmittel für eine Tätigkeit" },
        { word: "Fortschritt", pos: "Substantiv", definition: "Schrittweise Verbesserung" },
        { word: "Gewohnheit", pos: "Substantiv", definition: "Regelmäßig wiederholtes Verhalten" },
        { word: "Aufmerksamkeit", pos: "Substantiv", definition: "Bewusste Konzentration auf etwas" },
        { word: "Zuverlässigkeit", pos: "Substantiv", definition: "Eigenschaft, auf die man sich verlassen kann" },
        { word: "Geschwindigkeit", pos: "Substantiv", definition: "Maß dafür, wie schnell sich etwas bewegt" },
      ],
      hard: [
        { word: "Ästhetik", pos: "Substantiv", definition: "Lehre von Wahrnehmung und Schönheit" },
        { word: "Öffentlichkeit", pos: "Substantiv", definition: "Gesamtheit der Menschen in einer Gesellschaft" },
        { word: "Wahrscheinlichkeit", pos: "Substantiv", definition: "Maß für die Möglichkeit eines Ereignisses" },
        { word: "Verantwortungsbewusstsein", pos: "Substantiv", definition: "Bewusstsein für die Folgen des eigenen Handelns" },
        { word: "Zusammengehörigkeit", pos: "Substantiv", definition: "Gefühl, Teil einer Gemeinschaft zu sein" },
        { word: "Selbstverständlichkeit", pos: "Substantiv", definition: "Etwas, das als selbstverständlich gilt" },
        { word: "Unabhängigkeit", pos: "Substantiv", definition: "Freiheit von fremder Hilfe oder Kontrolle" },
        { word: "Möglichkeiten", pos: "Substantiv", definition: "Verschiedene Wege oder Optionen" },
      ],
    },
    quotes: [
      { id: "bundled-de-1", text: "Übung macht den Meister.", source: "Deutsches Sprichwort", length: "short" },
      { id: "bundled-de-2", text: "Der Anfang ist die Hälfte des Ganzen.", source: "Aristoteles", length: "short" },
      { id: "bundled-de-3", text: "Wer aufhört, besser werden zu wollen, hört auf, gut zu sein.", source: "Marie von Ebner-Eschenbach", length: "medium" },
      { id: "bundled-de-4", text: "Phantasie ist wichtiger als Wissen, denn Wissen ist begrenzt.", source: "Albert Einstein", length: "medium" },
      { id: "bundled-de-5", text: "Man sieht nur mit dem Herzen gut. Das Wesentliche ist für die Augen unsichtbar.", source: "Antoine de Saint-Exupéry", length: "long" },
      { id: "bundled-de-6", text: "Jeder Weg beginnt mit dem ersten Schritt und wächst durch beharrliches Üben.", source: "Deutsches Sprichwort", length: "long" },
    ],
  },

  "pt-BR": {
    commonWords: [
      "olá", "casa", "hoje", "amanhã", "pequeno", "aprender", "rápido", "amigo", "trabalho", "água",
      "ler", "escrever", "teclado", "prática", "tempo", "vida", "pergunta", "resposta", "importante", "correto",
      "juntos", "forte", "melhor", "calmo", "mundo", "palavra", "caminho", "luz", "feliz", "obrigado",
    ],
    vocab: {
      easy: [
        { word: "casa", pos: "substantivo", definition: "lugar onde uma pessoa mora" },
        { word: "gato", pos: "substantivo", definition: "pequeno animal doméstico" },
        { word: "cachorro", pos: "substantivo", definition: "animal doméstico que costuma latir" },
        { word: "árvore", pos: "substantivo", definition: "planta grande com tronco e galhos" },
        { word: "água", pos: "substantivo", definition: "líquido transparente necessário para beber" },
        { word: "amigo", pos: "substantivo", definition: "pessoa em quem se confia" },
        { word: "livro", pos: "substantivo", definition: "conjunto de páginas escritas ou impressas" },
        { word: "sol", pos: "substantivo", definition: "estrela que ilumina a Terra" },
      ],
      medium: [
        { word: "surpresa", pos: "substantivo", definition: "acontecimento inesperado" },
        { word: "pensamento", pos: "substantivo", definition: "ideia formada na mente" },
        { word: "ferramenta", pos: "substantivo", definition: "objeto que ajuda a realizar uma tarefa" },
        { word: "progresso", pos: "substantivo", definition: "melhoria gradual de uma situação" },
        { word: "costume", pos: "substantivo", definition: "maneira habitual de agir" },
        { word: "atenção", pos: "substantivo", definition: "concentração consciente em algo" },
        { word: "confiança", pos: "substantivo", definition: "segurança que se tem em alguém ou algo" },
        { word: "velocidade", pos: "substantivo", definition: "rapidez com que algo se move" },
      ],
      hard: [
        { word: "responsabilidade", pos: "substantivo", definition: "obrigação de responder pelos próprios atos" },
        { word: "probabilidade", pos: "substantivo", definition: "possibilidade de um acontecimento ocorrer" },
        { word: "independência", pos: "substantivo", definition: "liberdade para agir sem controle externo" },
        { word: "perseverança", pos: "substantivo", definition: "constância para continuar diante das dificuldades" },
        { word: "extraordinário", pos: "adjetivo", definition: "fora do comum ou do habitual" },
        { word: "conhecimento", pos: "substantivo", definition: "informação compreendida por uma pessoa" },
        { word: "colaboração", pos: "substantivo", definition: "trabalho conjunto para alcançar um objetivo" },
        { word: "criatividade", pos: "substantivo", definition: "capacidade de produzir ideias novas" },
      ],
    },
    quotes: [
      { id: "bundled-pt-br-1", text: "A prática leva à perfeição.", source: "Dito popular", length: "short" },
      { id: "bundled-pt-br-2", text: "Querer é poder.", source: "Provérbio", length: "short" },
      { id: "bundled-pt-br-3", text: "Toda jornada começa com um passo.", source: "Provérbio", length: "short" },
      { id: "bundled-pt-br-4", text: "O sucesso nasce da constância e do esforço diário.", source: "Dito popular", length: "medium" },
      { id: "bundled-pt-br-5", text: "Aprender algo novo todos os dias mantém a curiosidade viva.", source: "Reflexão popular", length: "medium" },
      { id: "bundled-pt-br-6", text: "Grandes mudanças começam com uma decisão pequena e corajosa.", source: "Reflexão popular", length: "long" },
    ],
  },

  zh: {
    commonWords: [
      "你好", "世界", "今天", "明天", "昨天", "学习", "工作", "朋友", "家庭", "生活",
      "时间", "问题", "答案", "重要", "正确", "一起", "努力", "更好", "安静", "快乐",
      "谢谢", "请", "书", "水", "太阳", "道路", "光明", "语言", "文字", "键盘",
      "练习", "速度", "开始", "希望", "未来",
    ],
    vocab: {
      easy: [
        { word: "家", pos: "名词", definition: "人们居住和生活的地方" },
        { word: "猫", pos: "名词", definition: "一种常见的小型家养动物" },
        { word: "狗", pos: "名词", definition: "一种忠诚的家养动物" },
        { word: "树", pos: "名词", definition: "有树干和树枝的大型植物" },
        { word: "水", pos: "名词", definition: "人和动物生活所需要的透明液体" },
        { word: "朋友", pos: "名词", definition: "彼此信任和喜欢的人" },
        { word: "书", pos: "名词", definition: "记录文字或图画的成册作品" },
        { word: "太阳", pos: "名词", definition: "给地球带来光和热的恒星" },
      ],
      medium: [
        { word: "惊喜", pos: "名词", definition: "意料之外的快乐或发现" },
        { word: "想法", pos: "名词", definition: "人在头脑中形成的意见或念头" },
        { word: "工具", pos: "名词", definition: "帮助人完成工作的器具" },
        { word: "进步", pos: "名词", definition: "能力或情况逐渐变好" },
        { word: "习惯", pos: "名词", definition: "长期重复形成的行为方式" },
        { word: "注意", pos: "名词", definition: "把心思集中在某件事情上" },
        { word: "信任", pos: "名词", definition: "相信别人可靠而值得依靠" },
        { word: "速度", pos: "名词", definition: "物体移动快慢的程度" },
      ],
      hard: [
        { word: "责任", pos: "名词", definition: "应当承担的任务和义务" },
        { word: "可能性", pos: "名词", definition: "事情有机会发生的程度" },
        { word: "独立", pos: "形容词", definition: "不依靠别人或外部力量" },
        { word: "坚持不懈", pos: "形容词", definition: "持续努力而不轻易放弃" },
        { word: "非凡", pos: "形容词", definition: "超过平常而特别出色" },
        { word: "知识", pos: "名词", definition: "通过学习和经验获得的认识" },
        { word: "合作", pos: "名词", definition: "为了共同目标一起完成事情" },
        { word: "创造力", pos: "名词", definition: "产生新想法和新作品的能力" },
      ],
    },
    quotes: [
      { id: "bundled-zh-1", text: "千里之行，始于足下。", source: "中国谚语", length: "short" },
      { id: "bundled-zh-2", text: "有志者，事竟成。", source: "中国谚语", length: "short" },
      { id: "bundled-zh-3", text: "熟能生巧。", source: "中国谚语", length: "short" },
      { id: "bundled-zh-4", text: "学而不思则罔，思而不学则殆。", source: "《论语》", length: "medium" },
      { id: "bundled-zh-5", text: "每一次练习都会让今天的自己更进一步。", source: "学习格言", length: "medium" },
      { id: "bundled-zh-6", text: "真正的进步来自耐心、专注和持续的努力。", source: "学习格言", length: "medium" },
      { id: "bundled-zh-7", text: "只要坚持学习并且勇于尝试，平凡的积累也能带来不平凡的改变。", source: "学习格言", length: "long" },
      { id: "bundled-zh-8", text: "在漫长的道路上，每一个认真完成的小步骤，都会把我们带向更好的未来。", source: "学习格言", length: "long" },
      { id: "bundled-zh-9", text: "当困难让人想要停下时，耐心和持续练习往往正是走向成功的关键。", source: "学习格言", length: "long" },
    ],
  },
};

export function getBundledTypingContent(languageCode: string): LocalizedContent | null {
  return isAvailableTypingLanguage(languageCode)
    ? BUNDLED_TYPING_CONTENT[languageCode]
    : null;
}

// Only use a localized pack when every generated-text mode has usable content.
// Otherwise a partial pack could quietly mix English into a localized test.
export function isLocalizedTypingContent(value: unknown): value is LocalizedContent {
  if (
    !isRecord(value) ||
    !Array.isArray(value.commonWords) ||
    value.commonWords.length === 0 ||
    !value.commonWords.every(isText) ||
    !isRecord(value.vocab) ||
    !Array.isArray(value.quotes) ||
    value.quotes.length === 0
  ) {
    return false;
  }

  const vocab = value.vocab;
  const hasAllVocabularyTiers = ["easy", "medium", "hard"].every((difficulty) => {
    const words = vocab[difficulty];
    return (
      Array.isArray(words) &&
      words.length > 0 &&
      words.every((word: unknown) =>
        isRecord(word) &&
        isText(word.word) &&
        isText(word.pos) &&
        isText(word.definition),
      )
    );
  });

  const hasValidQuotes = value.quotes.every((quote: unknown) =>
    isRecord(quote) &&
    isText(quote.id) &&
    isText(quote.text) &&
    isText(quote.source) &&
    (quote.length === "short" || quote.length === "medium" || quote.length === "long"),
  );

  return hasAllVocabularyTiers && hasValidQuotes;
}
