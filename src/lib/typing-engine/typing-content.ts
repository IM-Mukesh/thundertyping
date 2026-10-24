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
      "hola",
      "casa",
      "hoy",
      "mañana",
      "pequeño",
      "aprender",
      "rápido",
      "amigo",
      "trabajo",
      "agua",
      "leer",
      "escribir",
      "teclado",
      "práctica",
      "tiempo",
      "vida",
      "pregunta",
      "respuesta",
      "importante",
      "correcto",
      "juntos",
      "fuerte",
      "mejor",
      "tranquilo",
      "mundo",
      "palabra",
      "camino",
      "luz",
      "feliz",
      "gracias",
      "familia",
      "escuela",
      "ciudad",
      "país",
      "cielo",
      "tierra",
      "fuego",
      "aire",
      "libro",
      "música",
      "historia",
      "futuro",
      "persona",
      "mano",
      "ojos",
      "corazón",
      "pensar",
      "sentir",
      "hablar",
      "escuchar",
      "mirar",
      "caminar",
      "correr",
      "jugar",
      "viaje",
      "noche",
      "sol",
      "luna",
      "estrella",
      "sueño"
],
    vocab: {
      "easy": [
            {
                  "word": "casa",
                  "pos": "sustantivo",
                  "definition": "lugar donde vive una persona"
            },
            {
                  "word": "gato",
                  "pos": "sustantivo",
                  "definition": "animal doméstico pequeño"
            },
            {
                  "word": "perro",
                  "pos": "sustantivo",
                  "definition": "animal doméstico que suele ladrar"
            },
            {
                  "word": "árbol",
                  "pos": "sustantivo",
                  "definition": "planta grande con tronco y ramas"
            },
            {
                  "word": "agua",
                  "pos": "sustantivo",
                  "definition": "líquido transparente que necesitamos beber"
            },
            {
                  "word": "amigo",
                  "pos": "sustantivo",
                  "definition": "persona con la que existe confianza y cariño"
            },
            {
                  "word": "libro",
                  "pos": "sustantivo",
                  "definition": "conjunto de páginas escritas o impresas"
            },
            {
                  "word": "sol",
                  "pos": "sustantivo",
                  "definition": "estrella que ilumina la Tierra"
            },
            {
                  "word": "luna",
                  "pos": "sustantivo",
                  "definition": "satélite natural de la Tierra"
            },
            {
                  "word": "flor",
                  "pos": "sustantivo",
                  "definition": "parte vistosa de una planta"
            },
            {
                  "word": "río",
                  "pos": "sustantivo",
                  "definition": "corriente natural de agua continua"
            },
            {
                  "word": "mar",
                  "pos": "sustantivo",
                  "definition": "gran masa de agua salada"
            },
            {
                  "word": "mesa",
                  "pos": "sustantivo",
                  "definition": "mueble con tablero horizontal y patas"
            },
            {
                  "word": "puerta",
                  "pos": "sustantivo",
                  "definition": "abertura en una pared para entrar y salir"
            },
            {
                  "word": "mano",
                  "pos": "sustantivo",
                  "definition": "parte final del brazo humano"
            }
      ],
      "medium": [
            {
                  "word": "sorpresa",
                  "pos": "sustantivo",
                  "definition": "acontecimiento inesperado"
            },
            {
                  "word": "pensamiento",
                  "pos": "sustantivo",
                  "definition": "idea formada en la mente"
            },
            {
                  "word": "herramienta",
                  "pos": "sustantivo",
                  "definition": "objeto que ayuda a realizar una tarea"
            },
            {
                  "word": "progreso",
                  "pos": "sustantivo",
                  "definition": "mejora gradual de una situación"
            },
            {
                  "word": "costumbre",
                  "pos": "sustantivo",
                  "definition": "forma habitual de comportarse"
            },
            {
                  "word": "atención",
                  "pos": "sustantivo",
                  "definition": "concentración consciente en algo"
            },
            {
                  "word": "confianza",
                  "pos": "sustantivo",
                  "definition": "seguridad que se tiene en alguien o algo"
            },
            {
                  "word": "velocidad",
                  "pos": "sustantivo",
                  "definition": "rapidez con la que se mueve algo"
            },
            {
                  "word": "esfuerzo",
                  "pos": "sustantivo",
                  "definition": "empleo enérgico de la fuerza o el ánimo"
            },
            {
                  "word": "paciencia",
                  "pos": "sustantivo",
                  "definition": "capacidad de esperar con tranquilidad"
            },
            {
                  "word": "decisión",
                  "pos": "sustantivo",
                  "definition": "resolución firme que se toma sobre algo"
            },
            {
                  "word": "experiencia",
                  "pos": "sustantivo",
                  "definition": "conocimiento adquirido con la práctica"
            },
            {
                  "word": "curiosidad",
                  "pos": "sustantivo",
                  "definition": "deseo de saber o averiguar algo nuevo"
            },
            {
                  "word": "memoria",
                  "pos": "sustantivo",
                  "definition": "facultad de recordar el pasado"
            },
            {
                  "word": "constancia",
                  "pos": "sustantivo",
                  "definition": "firmeza y perseverancia en las acciones"
            }
      ],
      "hard": [
            {
                  "word": "responsabilidad",
                  "pos": "sustantivo",
                  "definition": "obligación de responder por los propios actos"
            },
            {
                  "word": "probabilidad",
                  "pos": "sustantivo",
                  "definition": "posibilidad de que ocurra un acontecimiento"
            },
            {
                  "word": "independencia",
                  "pos": "sustantivo",
                  "definition": "libertad para actuar sin control ajeno"
            },
            {
                  "word": "perseverancia",
                  "pos": "sustantivo",
                  "definition": "constancia para continuar ante las dificultades"
            },
            {
                  "word": "extraordinario",
                  "pos": "adjetivo",
                  "definition": "fuera de lo común o habitual"
            },
            {
                  "word": "conocimiento",
                  "pos": "sustantivo",
                  "definition": "información comprendida por una persona"
            },
            {
                  "word": "colaboración",
                  "pos": "sustantivo",
                  "definition": "trabajo conjunto para lograr un objetivo"
            },
            {
                  "word": "creatividad",
                  "pos": "sustantivo",
                  "definition": "capacidad de producir ideas nuevas"
            },
            {
                  "word": "sostenibilidad",
                  "pos": "sustantivo",
                  "definition": "capacidad de mantenerse sin agotar recursos"
            },
            {
                  "word": "vulnerabilidad",
                  "pos": "sustantivo",
                  "definition": "cualidad de poder ser herido o afectado"
            },
            {
                  "word": "determinación",
                  "pos": "sustantivo",
                  "definition": "firmeza en el propósito de conseguir algo"
            },
            {
                  "word": "trascendencia",
                  "pos": "sustantivo",
                  "definition": "importancia que sobrepasa los límites habituales"
            },
            {
                  "word": "magnanimidad",
                  "pos": "sustantivo",
                  "definition": "grandeza y generosidad de ánimo"
            },
            {
                  "word": "autenticidad",
                  "pos": "sustantivo",
                  "definition": "cualidad de ser genuino y verdadero"
            },
            {
                  "word": "resiliencia",
                  "pos": "sustantivo",
                  "definition": "capacidad de sobreponerse a situaciones adversas"
            }
      ]
},
    quotes: [
      {
            "id": "bundled-es-1",
            "text": "La práctica hace al maestro.",
            "source": "Dicho popular",
            "length": "short"
      },
      {
            "id": "bundled-es-2",
            "text": "Querer es poder.",
            "source": "Proverbio",
            "length": "short"
      },
      {
            "id": "bundled-es-3",
            "text": "El comienzo es la mitad de todo.",
            "source": "Aristóteles",
            "length": "short"
      },
      {
            "id": "bundled-es-4",
            "text": "El éxito nace de la constancia y del esfuerzo diario.",
            "source": "Dicho popular",
            "length": "medium"
      },
      {
            "id": "bundled-es-5",
            "text": "Aprender algo nuevo cada día mantiene despierta la curiosidad.",
            "source": "Reflexión popular",
            "length": "medium"
      },
      {
            "id": "bundled-es-6",
            "text": "Los grandes cambios empiezan con una decisión pequeña y valiente.",
            "source": "Reflexión popular",
            "length": "long"
      },
      {
            "id": "bundled-es-7",
            "text": "No hay camino para la paz, la paz es el camino.",
            "source": "Mahatma Gandhi",
            "length": "medium"
      },
      {
            "id": "bundled-es-8",
            "text": "Caminante, no hay camino, se hace camino al andar.",
            "source": "Antonio Machado",
            "length": "medium"
      },
      {
            "id": "bundled-es-9",
            "text": "En un lugar de la Mancha, de cuyo nombre no quiero acordarme, no ha mucho tiempo que vivía un hidalgo.",
            "source": "Miguel de Cervantes",
            "length": "long"
      },
      {
            "id": "bundled-es-10",
            "text": "La educación es el arma más poderosa que puedes usar para cambiar el mundo.",
            "source": "Nelson Mandela",
            "length": "long"
      }
],
  },

  hi: {
    commonWords: [
      "नमस्ते",
      "घर",
      "आज",
      "कल",
      "छोटा",
      "सीखना",
      "तेज़",
      "दोस्त",
      "काम",
      "पानी",
      "पढ़ना",
      "लिखना",
      "कुंजीपटल",
      "अभ्यास",
      "समय",
      "जीवन",
      "प्रश्न",
      "उत्तर",
      "महत्वपूर्ण",
      "सही",
      "साथ",
      "मज़बूत",
      "बेहतर",
      "शांत",
      "दुनिया",
      "शब्द",
      "रास्ता",
      "प्रकाश",
      "खुश",
      "धन्यवाद",
      "किताब",
      "भाषा",
      "विद्या",
      "परिवार",
      "देश",
      "सपना",
      "मेहनत",
      "सफलता",
      "ज्ञान",
      "विचार",
      "मन",
      "हृदय",
      "सूरज",
      "चांद",
      "तारा",
      "हवा",
      "आकाश",
      "धरती",
      "समुद्र",
      "नदी",
      "पहाड़",
      "जंगल",
      "फूल",
      "फल",
      "पेड़",
      "पक्षी",
      "सुंदर",
      "सरल",
      "कठिन",
      "नया",
      "पुराना",
      "सच्चा",
      "साहस",
      "शक्ति",
      "विश्वास",
      "उम्मीद",
      "लक्ष्य",
      "मार्ग",
      "यात्रा",
      "गति",
      "नियम",
      "स्थान",
      "शहर",
      "गांव",
      "समाज",
      "संस्कृति",
      "इतिहास",
      "वर्तमान",
      "भविष्य",
      "आनंद",
      "शांति",
      "प्रेम",
      "सहानुभूति",
      "प्रकृति",
      "विज्ञान",
      "कला",
      "संगीत",
      "साहित्य",
      "कविता",
      "कहानी",
      "लेख",
      "वाक्य",
      "अर्थ",
      "ध्वनि",
      "स्वर",
      "व्यंजन",
      "मात्रा",
      "अक्षर",
      "चेतना",
      "प्रयास",
      "दृष्टिकोण",
      "कौशल",
      "सृजन",
      "अनुभव",
      "उपलब्धि",
      "सम्मान",
      "सद्भाव"
],
    vocab: {
      "easy": [
            {
                  "word": "घर",
                  "pos": "संज्ञा",
                  "definition": "रहने की जगह"
            },
            {
                  "word": "बिल्ली",
                  "pos": "संज्ञा",
                  "definition": "एक छोटा पालतू जानवर"
            },
            {
                  "word": "कुत्ता",
                  "pos": "संज्ञा",
                  "definition": "भौंकने वाला पालतू जानवर"
            },
            {
                  "word": "पेड़",
                  "pos": "संज्ञा",
                  "definition": "तने और शाखाओं वाला बड़ा पौधा"
            },
            {
                  "word": "पानी",
                  "pos": "संज्ञा",
                  "definition": "पीने के लिए आवश्यक तरल पदार्थ"
            },
            {
                  "word": "दोस्त",
                  "pos": "संज्ञा",
                  "definition": "विश्वास और स्नेह वाला व्यक्ति"
            },
            {
                  "word": "किताब",
                  "pos": "संज्ञा",
                  "definition": "लिखे हुए पन्नों का संग्रह"
            },
            {
                  "word": "सूरज",
                  "pos": "संज्ञा",
                  "definition": "पृथ्वी को रोशनी देने वाला तारा"
            },
            {
                  "word": "नदी",
                  "pos": "संज्ञा",
                  "definition": "प्राकृतिक रूप से बहने वाली जलधारा"
            },
            {
                  "word": "फूल",
                  "pos": "संज्ञा",
                  "definition": "पौधे का सुंदर और सुगंधित भाग"
            },
            {
                  "word": "फल",
                  "pos": "संज्ञा",
                  "definition": "पौधे का खाने योग्य मीठा भाग"
            },
            {
                  "word": "हवा",
                  "pos": "संज्ञा",
                  "definition": "चारों ओर बहने वाली वायु"
            },
            {
                  "word": "आकाश",
                  "pos": "संज्ञा",
                  "definition": "पृथ्वी के ऊपर फैला हुआ खुला क्षेत्र"
            },
            {
                  "word": "तारा",
                  "pos": "संज्ञा",
                  "definition": "रात में चमकने वाला खगोलीय पिंड"
            },
            {
                  "word": "शहर",
                  "pos": "संज्ञा",
                  "definition": "बड़ी आबादी वाला विकसित क्षेत्र"
            },
            {
                  "word": "गांव",
                  "pos": "संज्ञा",
                  "definition": "ग्रामीण परिवेश की छोटी बस्ती"
            },
            {
                  "word": "रास्ता",
                  "pos": "संज्ञा",
                  "definition": "एक स्थान से दूसरे स्थान जाने का मार्ग"
            },
            {
                  "word": "दिन",
                  "pos": "संज्ञा",
                  "definition": "सुबह से शाम तक का उजाले वाला समय"
            },
            {
                  "word": "रात",
                  "pos": "संज्ञा",
                  "definition": "अंधेरे वाला समय जब तारे दिखते हैं"
            },
            {
                  "word": "हाथ",
                  "pos": "संज्ञा",
                  "definition": "शरीर का कार्य करने वाला अंग"
            },
            {
                  "word": "आंख",
                  "pos": "संज्ञा",
                  "definition": "देखने में सहायक इंद्रिय"
            },
            {
                  "word": "कान",
                  "pos": "संज्ञा",
                  "definition": "ध्वनि सुनने में सहायक इंद्रिय"
            },
            {
                  "word": "मन",
                  "pos": "संज्ञा",
                  "definition": "सोचने और महसूस करने की आंतरिक शक्ति"
            },
            {
                  "word": "बात",
                  "pos": "संज्ञा",
                  "definition": "मुख से कही जाने वाली वाणी"
            },
            {
                  "word": "नाम",
                  "pos": "संज्ञा",
                  "definition": "किसी व्यक्ति या वस्तु की पहचान"
            }
      ],
      "medium": [
            {
                  "word": "आश्चर्य",
                  "pos": "संज्ञा",
                  "definition": "अचानक होने वाली अनपेक्षित बात"
            },
            {
                  "word": "विचार",
                  "pos": "संज्ञा",
                  "definition": "मन में बनी हुई सोच"
            },
            {
                  "word": "उपकरण",
                  "pos": "संज्ञा",
                  "definition": "किसी काम में सहायता देने वाली वस्तु"
            },
            {
                  "word": "प्रगति",
                  "pos": "संज्ञा",
                  "definition": "धीरे-धीरे होने वाला सुधार"
            },
            {
                  "word": "आदत",
                  "pos": "संज्ञा",
                  "definition": "बार-बार दोहराया जाने वाला व्यवहार"
            },
            {
                  "word": "ध्यान",
                  "pos": "संज्ञा",
                  "definition": "किसी विषय पर मन की एकाग्रता"
            },
            {
                  "word": "विश्वसनीयता",
                  "pos": "संज्ञा",
                  "definition": "भरोसा करने योग्य होने का गुण"
            },
            {
                  "word": "गति",
                  "pos": "संज्ञा",
                  "definition": "किसी वस्तु के चलने की तेजी"
            },
            {
                  "word": "परिश्रम",
                  "pos": "संज्ञा",
                  "definition": "किसी लक्ष्य को पाने के लिए की गई कड़ी मेहनत"
            },
            {
                  "word": "अनुभव",
                  "pos": "संज्ञा",
                  "definition": "जीवन और कार्य से प्राप्त व्यावहारिक समझ"
            },
            {
                  "word": "उत्साह",
                  "pos": "संज्ञा",
                  "definition": "किसी काम को करने की तीव्र उमंग"
            },
            {
                  "word": "सहानुभूति",
                  "pos": "संज्ञा",
                  "definition": "दूसरों के दुख को समझने की भावना"
            },
            {
                  "word": "सफलता",
                  "pos": "संज्ञा",
                  "definition": "उद्देश्य या लक्ष्य की प्राप्ति"
            },
            {
                  "word": "दृष्टिकोण",
                  "pos": "संज्ञा",
                  "definition": "किसी विषय को देखने और समझने का नजरिया"
            },
            {
                  "word": "संयम",
                  "pos": "संज्ञा",
                  "definition": "स्वयं की इच्छाओं पर नियंत्रण रखने की क्षमता"
            },
            {
                  "word": "जिज्ञासा",
                  "pos": "संज्ञा",
                  "definition": "नई बातें जानने और सीखने की गहरी इच्छा"
            },
            {
                  "word": "निर्णय",
                  "pos": "संज्ञा",
                  "definition": "सोच-विचार कर लिया गया अंतिम फैसला"
            },
            {
                  "word": "प्रशंसा",
                  "pos": "संज्ञा",
                  "definition": "किसी के अच्छे काम की सराहना करना"
            },
            {
                  "word": "कौशल",
                  "pos": "संज्ञा",
                  "definition": "किसी कार्य को निपुणता से करने की योग्यता"
            },
            {
                  "word": "सद्भाव",
                  "pos": "संज्ञा",
                  "definition": "दूसरों के प्रति अच्छी और निष्कपट भावना"
            },
            {
                  "word": "धैर्य",
                  "pos": "संज्ञा",
                  "definition": "मुश्किल समय में भी शांत रहने की क्षमता"
            },
            {
                  "word": "परिवर्तन",
                  "pos": "संज्ञा",
                  "definition": "पुरानी स्थिति में आने वाला नया बदलाव"
            },
            {
                  "word": "प्रेरणा",
                  "pos": "संज्ञा",
                  "definition": "आगे बढ़ने का उत्साह देने वाला विचार"
            },
            {
                  "word": "सहयोग",
                  "pos": "संज्ञा",
                  "definition": "किसी उद्देश्य के लिए मिलकर किया गया काम"
            },
            {
                  "word": "मार्गदर्शन",
                  "pos": "संज्ञा",
                  "definition": "सही दिशा दिखाने वाली उपयोगी सलाह"
            }
      ],
      "hard": [
            {
                  "word": "उत्तरदायित्व",
                  "pos": "संज्ञा",
                  "definition": "अपने कार्यों के लिए जवाबदेह होने का दायित्व"
            },
            {
                  "word": "संभावना",
                  "pos": "संज्ञा",
                  "definition": "किसी घटना के होने की मुमकिन स्थिति"
            },
            {
                  "word": "स्वतंत्रता",
                  "pos": "संज्ञा",
                  "definition": "बाहरी नियंत्रण से मुक्त होने की अवस्था"
            },
            {
                  "word": "दृढ़निश्चय",
                  "pos": "संज्ञा",
                  "definition": "लक्ष्य पूरा करने का मजबूत संकल्प"
            },
            {
                  "word": "असाधारण",
                  "pos": "विशेषण",
                  "definition": "सामान्य से बहुत अलग या अनोखा"
            },
            {
                  "word": "ज्ञान",
                  "pos": "संज्ञा",
                  "definition": "सीखने से प्राप्त समझ और जानकारी"
            },
            {
                  "word": "सहयोगिता",
                  "pos": "संज्ञा",
                  "definition": "सामूहिक रूप से साझा प्रयास करने की प्रवृत्ति"
            },
            {
                  "word": "रचनात्मकता",
                  "pos": "संज्ञा",
                  "definition": "नए विचार और मौलिक कृतियां बनाने की क्षमता"
            },
            {
                  "word": "पारदर्शिता",
                  "pos": "संज्ञा",
                  "definition": "बिना किसी छिपाव के स्पष्ट होने की स्थिति"
            },
            {
                  "word": "सहनशीलता",
                  "pos": "संज्ञा",
                  "definition": "कठिनाइयों और मतभेदों को सहन करने का गुण"
            },
            {
                  "word": "आत्मनिर्भरता",
                  "pos": "संज्ञा",
                  "definition": "स्वयं के बल पर जीवन जीने की सामर्थ्य"
            },
            {
                  "word": "सहानुभूतिशीलता",
                  "pos": "संज्ञा",
                  "definition": "गहराई से दूसरों की पीड़ा महसूस करने की क्षमता"
            },
            {
                  "word": "विवेकशीलता",
                  "pos": "संज्ञा",
                  "definition": "उचित और अनुचित का भेद करने की प्रज्ञा"
            },
            {
                  "word": "प्रतिबद्धता",
                  "pos": "संज्ञा",
                  "definition": "किसी कार्य को पूरा करने का पक्का वादा"
            },
            {
                  "word": "समर्पण",
                  "pos": "संज्ञा",
                  "definition": "किसी उच्च लक्ष्य के प्रति पूर्ण निष्ठा"
            },
            {
                  "word": "दूरदर्शिता",
                  "pos": "संज्ञा",
                  "definition": "भविष्य के परिणामों का पूर्व अनुमान लगाने की क्षमता"
            },
            {
                  "word": "प्रोत्साहन",
                  "pos": "संज्ञा",
                  "definition": "आगे बढ़ने के लिए दिया जाने वाला संबल"
            },
            {
                  "word": "उत्कृष्टता",
                  "pos": "संज्ञा",
                  "definition": "कार्य में सर्वोच्च गुणवत्ता प्राप्त करना"
            },
            {
                  "word": "कर्तव्यनिष्ठा",
                  "pos": "संज्ञा",
                  "definition": "अपने दायित्व को ईमानदारी से पूरा करने का भाव"
            },
            {
                  "word": "अनुकूलन",
                  "pos": "संज्ञा",
                  "definition": "नई परिस्थितियों के अनुरूप ढलने की योग्यता"
            },
            {
                  "word": "स्वावलंबन",
                  "pos": "संज्ञा",
                  "definition": "दूसरों पर निर्भर न रहकर स्वयं कार्य करना"
            },
            {
                  "word": "सत्यनिष्ठा",
                  "pos": "संज्ञा",
                  "definition": "सदा सत्य और नैतिक मूल्यों पर टिके रहना"
            },
            {
                  "word": "अखंडता",
                  "pos": "संज्ञा",
                  "definition": "पूर्णता और अविभाज्य होने का मौलिक गुण"
            },
            {
                  "word": "प्रामाणिकता",
                  "pos": "संज्ञा",
                  "definition": "तथ्यों और साक्ष्यों पर खरा उतरने का भाव"
            },
            {
                  "word": "उदात्तता",
                  "pos": "संज्ञा",
                  "definition": "विचारों और चरित्र का अत्यंत ऊंचा स्तर"
            }
      ]
},
    quotes: [
      {
            "id": "bundled-hi-1",
            "text": "जहाँ चाह, वहाँ राह।",
            "source": "हिंदी कहावत",
            "length": "short"
      },
      {
            "id": "bundled-hi-2",
            "text": "कर्म ही पूजा है।",
            "source": "लोकप्रिय कहावत",
            "length": "short"
      },
      {
            "id": "bundled-hi-3",
            "text": "सत्यमेव जयते नानृतम्।",
            "source": "मुण्डक उपनिषद्",
            "length": "short"
      },
      {
            "id": "bundled-hi-4",
            "text": "उठो, जागो और तब तक मत रुको जब तक लक्ष्य प्राप्त न हो जाए।",
            "source": "स्वामी विवेकानंद",
            "length": "medium"
      },
      {
            "id": "bundled-hi-5",
            "text": "व्यक्ति अपने विचारों से निर्मित प्राणी है, वह जैसा सोचता है वैसा ही बन जाता है।",
            "source": "महात्मा गांधी",
            "length": "medium"
      },
      {
            "id": "bundled-hi-6",
            "text": "विद्या ददाति विनयं विनयाद्याति पात्रताम्।",
            "source": "हितोपदेश",
            "length": "short"
      },
      {
            "id": "bundled-hi-7",
            "text": "लगन को किसी भी परिस्थिति में न छोड़ना ही सफलता का मूलमंत्र है।",
            "source": "मुंशी प्रेमचंद",
            "length": "medium"
      },
      {
            "id": "bundled-hi-8",
            "text": "लहरों से डर कर नौका पार नहीं होती, कोशिश करने वालों की कभी हार नहीं होती।",
            "source": "हरिवंश राय बच्चन",
            "length": "medium"
      },
      {
            "id": "bundled-hi-9",
            "text": "बड़ा भया तो क्या भया, जैसे पेड़ खजूर। पंथी को छाया नहीं, फल लागै अति दूर।",
            "source": "कबीर दास",
            "length": "long"
      },
      {
            "id": "bundled-hi-10",
            "text": "रहिमन देखि बड़ेन को, लघु न दीजिए डारि। जहाँ काम आवै सुई, कहा करै तरवारि।",
            "source": "रहीम",
            "length": "long"
      },
      {
            "id": "bundled-hi-11",
            "text": "सफलता पूर्व तैयारी पर निर्भर करती है, और बिना ऐसी तैयारी के असफलता निश्चित है।",
            "source": "चाणक्य नीति",
            "length": "medium"
      },
      {
            "id": "bundled-hi-12",
            "text": "ज्ञान में किया गया निवेश सबसे अधिक और सबसे स्थायी लाभ देता है।",
            "source": "प्रेरक विचार",
            "length": "medium"
      },
      {
            "id": "bundled-hi-13",
            "text": "जो व्यक्ति निरंतर अभ्यास करता है, वह कठिन से कठिन काम को भी सरल बना लेता है।",
            "source": "पंचतंत्र",
            "length": "long"
      },
      {
            "id": "bundled-hi-14",
            "text": "विपत्ति में धैर्य, वैभव में क्षमा, और सभा में वाक्पटुता ही महान पुरुषों के स्वाभाविक लक्षण हैं।",
            "source": "नीतिशतकम्",
            "length": "long"
      },
      {
            "id": "bundled-hi-15",
            "text": "जब तक आप स्वयं पर विश्वास नहीं करते, तब तक आप ईश्वर पर भी विश्वास नहीं कर सकते।",
            "source": "स्वामी विवेकानंद",
            "length": "long"
      }
],
  },

  de: {
    commonWords: [
      "hallo",
      "haus",
      "heute",
      "klein",
      "morgen",
      "lernen",
      "schnell",
      "freund",
      "arbeit",
      "wasser",
      "lesen",
      "schreiben",
      "tastatur",
      "übung",
      "zeit",
      "leben",
      "frage",
      "antwort",
      "wichtig",
      "richtig",
      "gemeinsam",
      "stark",
      "besser",
      "ruhig",
      "welt",
      "wort",
      "weg",
      "licht",
      "glücklich",
      "danke",
      "familie",
      "schule",
      "stadt",
      "land",
      "himmel",
      "erde",
      "feuer",
      "luft",
      "buch",
      "musik",
      "geschichte",
      "zukunft",
      "mensch",
      "hand",
      "augen",
      "herz",
      "denken",
      "fühlen",
      "sprechen",
      "hören",
      "sehen",
      "gehen",
      "laufen",
      "spielen",
      "reise",
      "nacht",
      "sonne",
      "mond",
      "stern",
      "traum"
],
    vocab: {
      "easy": [
            {
                  "word": "Haus",
                  "pos": "Substantiv",
                  "definition": "Gebäude, in dem Menschen leben"
            },
            {
                  "word": "Katze",
                  "pos": "Substantiv",
                  "definition": "Kleines, pelziges Haustier"
            },
            {
                  "word": "Hund",
                  "pos": "Substantiv",
                  "definition": "Vierbeiniges Haustier, das bellt"
            },
            {
                  "word": "Baum",
                  "pos": "Substantiv",
                  "definition": "Große Pflanze mit einem Holzstamm"
            },
            {
                  "word": "Wasser",
                  "pos": "Substantiv",
                  "definition": "Klare Flüssigkeit zum Trinken"
            },
            {
                  "word": "Freund",
                  "pos": "Substantiv",
                  "definition": "Person, der man vertraut"
            },
            {
                  "word": "Buch",
                  "pos": "Substantiv",
                  "definition": "Geschriebene oder gedruckte Sammlung von Seiten"
            },
            {
                  "word": "Sonne",
                  "pos": "Substantiv",
                  "definition": "Stern, der die Erde beleuchtet"
            },
            {
                  "word": "Mond",
                  "pos": "Substantiv",
                  "definition": "Natürlicher Satellit der Erde"
            },
            {
                  "word": "Blume",
                  "pos": "Substantiv",
                  "definition": "Schöner, farbiger Teil einer Pflanze"
            },
            {
                  "word": "Fluss",
                  "pos": "Substantiv",
                  "definition": "Natürlicher, fließender Wasserlauf"
            },
            {
                  "word": "Meer",
                  "pos": "Substantiv",
                  "definition": "Große Masse von Salzwasser"
            },
            {
                  "word": "Tisch",
                  "pos": "Substantiv",
                  "definition": "Möbelstück mit einer horizontalen Platte"
            },
            {
                  "word": "Tür",
                  "pos": "Substantiv",
                  "definition": "Bewegliche Vorrichtung zum Schließen eines Eingangs"
            },
            {
                  "word": "Hand",
                  "pos": "Substantiv",
                  "definition": "Greiforgan am Ende des menschlichen Arms"
            }
      ],
      "medium": [
            {
                  "word": "Überraschung",
                  "pos": "Substantiv",
                  "definition": "Unerwartetes Ereignis"
            },
            {
                  "word": "Gedanke",
                  "pos": "Substantiv",
                  "definition": "Inhalt des bewussten Denkens"
            },
            {
                  "word": "Werkzeug",
                  "pos": "Substantiv",
                  "definition": "Hilfsmittel für eine Tätigkeit"
            },
            {
                  "word": "Fortschritt",
                  "pos": "Substantiv",
                  "definition": "Schrittweise Verbesserung"
            },
            {
                  "word": "Gewohnheit",
                  "pos": "Substantiv",
                  "definition": "Regelmäßig wiederholtes Verhalten"
            },
            {
                  "word": "Aufmerksamkeit",
                  "pos": "Substantiv",
                  "definition": "Bewusste Konzentration auf etwas"
            },
            {
                  "word": "Zuverlässigkeit",
                  "pos": "Substantiv",
                  "definition": "Eigenschaft, auf die man sich verlassen kann"
            },
            {
                  "word": "Geschwindigkeit",
                  "pos": "Substantiv",
                  "definition": "Maß dafür, wie schnell sich etwas bewegt"
            },
            {
                  "word": "Erfahrung",
                  "pos": "Substantiv",
                  "definition": "Wissen, das durch praktische Übung entsteht"
            },
            {
                  "word": "Entscheidung",
                  "pos": "Substantiv",
                  "definition": "Wahl zwischen verschiedenen Möglichkeiten"
            },
            {
                  "word": "Geduld",
                  "pos": "Substantiv",
                  "definition": "Fähigkeit, ruhig auf etwas zu warten"
            },
            {
                  "word": "Begeisterung",
                  "pos": "Substantiv",
                  "definition": "Zustand freudiger Erregung und Anteilnahme"
            },
            {
                  "word": "Erinnerung",
                  "pos": "Substantiv",
                  "definition": "Gedächtnisbild an Vergangenes"
            },
            {
                  "word": "Ausdauer",
                  "pos": "Substantiv",
                  "definition": "Fähigkeit, eine Anstrengung lange durchzuhalten"
            },
            {
                  "word": "Neugierde",
                  "pos": "Substantiv",
                  "definition": "Verlangen, Unbekanntes zu erfahren"
            }
      ],
      "hard": [
            {
                  "word": "Ästhetik",
                  "pos": "Substantiv",
                  "definition": "Lehre von Wahrnehmung und Schönheit"
            },
            {
                  "word": "Öffentlichkeit",
                  "pos": "Substantiv",
                  "definition": "Gesamtheit der Menschen in einer Gesellschaft"
            },
            {
                  "word": "Wahrscheinlichkeit",
                  "pos": "Substantiv",
                  "definition": "Maß für die Möglichkeit eines Ereignisses"
            },
            {
                  "word": "Verantwortungsbewusstsein",
                  "pos": "Substantiv",
                  "definition": "Bewusstsein für die Folgen des eigenen Handelns"
            },
            {
                  "word": "Zusammengehörigkeit",
                  "pos": "Substantiv",
                  "definition": "Gefühl, Teil einer Gemeinschaft zu sein"
            },
            {
                  "word": "Selbstverständlichkeit",
                  "pos": "Substantiv",
                  "definition": "Etwas, das als selbstverständlich gilt"
            },
            {
                  "word": "Unabhängigkeit",
                  "pos": "Substantiv",
                  "definition": "Freiheit von fremder Hilfe oder Kontrolle"
            },
            {
                  "word": "Möglichkeiten",
                  "pos": "Substantiv",
                  "definition": "Verschiedene Wege oder Optionen"
            },
            {
                  "word": "Nachhaltigkeit",
                  "pos": "Substantiv",
                  "definition": "Prinzip, nach dem nicht mehr verbraucht werden darf als nachwachsen kann"
            },
            {
                  "word": "Widerstandsfähigkeit",
                  "pos": "Substantiv",
                  "definition": "Fähigkeit, schwierige Situationen unbeschadet zu überstehen"
            },
            {
                  "word": "Gleichberechtigung",
                  "pos": "Substantiv",
                  "definition": "Gleiche Rechte für alle Personen"
            },
            {
                  "word": "Entschlossenheit",
                  "pos": "Substantiv",
                  "definition": "Fester Wille, ein Ziel zu erreichen"
            },
            {
                  "word": "Vertrauenswürdigkeit",
                  "pos": "Substantiv",
                  "definition": "Eigenschaft, uneingeschränktes Vertrauen zu verdienen"
            },
            {
                  "word": "Aufrichtigkeit",
                  "pos": "Substantiv",
                  "definition": "Ehrlichkeit und Geradlinigkeit im Wesen"
            },
            {
                  "word": "Differenzierung",
                  "pos": "Substantiv",
                  "definition": "Feine Unterscheidung von Merkmalen"
            }
      ]
},
    quotes: [
      {
            "id": "bundled-de-1",
            "text": "Übung macht den Meister.",
            "source": "Deutsches Sprichwort",
            "length": "short"
      },
      {
            "id": "bundled-de-2",
            "text": "Der Anfang ist die Hälfte des Ganzen.",
            "source": "Aristoteles",
            "length": "short"
      },
      {
            "id": "bundled-de-3",
            "text": "Wer aufhört, besser werden zu wollen, hört auf, gut zu sein.",
            "source": "Marie von Ebner-Eschenbach",
            "length": "medium"
      },
      {
            "id": "bundled-de-4",
            "text": "Phantasie ist wichtiger als Wissen, denn Wissen ist begrenzt.",
            "source": "Albert Einstein",
            "length": "medium"
      },
      {
            "id": "bundled-de-5",
            "text": "Man sieht nur mit dem Herzen gut. Das Wesentliche ist für die Augen unsichtbar.",
            "source": "Antoine de Saint-Exupéry",
            "length": "long"
      },
      {
            "id": "bundled-de-6",
            "text": "Jeder Weg beginnt mit dem ersten Schritt und wächst durch beharrliches Üben.",
            "source": "Deutsches Sprichwort",
            "length": "long"
      },
      {
            "id": "bundled-de-7",
            "text": "Es ist nicht genug zu wissen, man muss auch anwenden; es ist nicht genug zu wollen, man muss auch tun.",
            "source": "Johann Wolfgang von Goethe",
            "length": "long"
      },
      {
            "id": "bundled-de-8",
            "text": "Inmitten der Schwierigkeit liegt die Möglichkeit.",
            "source": "Albert Einstein",
            "length": "short"
      },
      {
            "id": "bundled-de-9",
            "text": "Geduld ist das Vertrauen, dass alles kommt, wenn die Zeit dafür reif ist.",
            "source": "Deutsches Sprichwort",
            "length": "medium"
      },
      {
            "id": "bundled-de-10",
            "text": "Auch aus Steinen, die einem in den Weg gelegt werden, kann man Schönes bauen.",
            "source": "Johann Wolfgang von Goethe",
            "length": "medium"
      }
],
  },

  "pt-BR": {
    commonWords: [
      "olá",
      "casa",
      "hoje",
      "amanhã",
      "pequeno",
      "aprender",
      "rápido",
      "amigo",
      "trabalho",
      "água",
      "ler",
      "escrever",
      "teclado",
      "prática",
      "tempo",
      "vida",
      "pergunta",
      "resposta",
      "importante",
      "correto",
      "juntos",
      "forte",
      "melhor",
      "calmo",
      "mundo",
      "palavra",
      "caminho",
      "luz",
      "feliz",
      "obrigado",
      "família",
      "escola",
      "cidade",
      "país",
      "céu",
      "terra",
      "fogo",
      "ar",
      "livro",
      "música",
      "história",
      "futuro",
      "pessoa",
      "mão",
      "olhos",
      "coração",
      "pensar",
      "sentir",
      "falar",
      "ouvir",
      "olhar",
      "andar",
      "correr",
      "jogar",
      "viagem",
      "noite",
      "sol",
      "lua",
      "estrela",
      "sonho"
],
    vocab: {
      "easy": [
            {
                  "word": "casa",
                  "pos": "substantivo",
                  "definition": "lugar onde uma pessoa mora"
            },
            {
                  "word": "gato",
                  "pos": "substantivo",
                  "definition": "pequeno animal doméstico"
            },
            {
                  "word": "cachorro",
                  "pos": "substantivo",
                  "definition": "animal doméstico que costuma latir"
            },
            {
                  "word": "árvore",
                  "pos": "substantivo",
                  "definition": "planta grande com tronco e galhos"
            },
            {
                  "word": "água",
                  "pos": "substantivo",
                  "definition": "líquido transparente necessário para beber"
            },
            {
                  "word": "amigo",
                  "pos": "substantivo",
                  "definition": "pessoa em quem se confia"
            },
            {
                  "word": "livro",
                  "pos": "substantivo",
                  "definition": "conjunto de páginas escritas ou impressas"
            },
            {
                  "word": "sol",
                  "pos": "substantivo",
                  "definition": "estrela que ilumina a Terra"
            },
            {
                  "word": "lua",
                  "pos": "substantivo",
                  "definition": "satélite natural da Terra"
            },
            {
                  "word": "flor",
                  "pos": "substantivo",
                  "definition": "parte colorida e vistosa de uma planta"
            },
            {
                  "word": "rio",
                  "pos": "substantivo",
                  "definition": "curso natural de água contínua"
            },
            {
                  "word": "mar",
                  "pos": "substantivo",
                  "definition": "grande extensão de água salgada"
            },
            {
                  "word": "mesa",
                  "pos": "substantivo",
                  "definition": "móvel com tampo horizontal e pés"
            },
            {
                  "word": "porta",
                  "pos": "substantivo",
                  "definition": "abertura para entrar e sair de um aposento"
            },
            {
                  "word": "mão",
                  "pos": "substantivo",
                  "definition": "extremidade do braço usada para segurar coisas"
            }
      ],
      "medium": [
            {
                  "word": "surpresa",
                  "pos": "substantivo",
                  "definition": "acontecimento inesperado"
            },
            {
                  "word": "pensamento",
                  "pos": "substantivo",
                  "definition": "ideia formada na mente"
            },
            {
                  "word": "ferramenta",
                  "pos": "substantivo",
                  "definition": "objeto que ajuda a realizar uma tarefa"
            },
            {
                  "word": "progresso",
                  "pos": "substantivo",
                  "definition": "melhoria gradual de uma situação"
            },
            {
                  "word": "costume",
                  "pos": "substantivo",
                  "definition": "maneira habitual de agir"
            },
            {
                  "word": "atenção",
                  "pos": "substantivo",
                  "definition": "concentração consciente em algo"
            },
            {
                  "word": "confiança",
                  "pos": "substantivo",
                  "definition": "segurança que se tem em alguém ou algo"
            },
            {
                  "word": "velocidade",
                  "pos": "substantivo",
                  "definition": "rapidez com que algo se move"
            },
            {
                  "word": "esforço",
                  "pos": "substantivo",
                  "definition": "emprego de energia física ou mental para alcançar um fim"
            },
            {
                  "word": "paciência",
                  "pos": "substantivo",
                  "definition": "capacidade de esperar com calma"
            },
            {
                  "word": "decisão",
                  "pos": "substantivo",
                  "definition": "resolução tomada após ponderação"
            },
            {
                  "word": "experiência",
                  "pos": "substantivo",
                  "definition": "conhecimento adquirido por meio da prática"
            },
            {
                  "word": "curiosidade",
                  "pos": "substantivo",
                  "definition": "desejo de conhecer ou aprender novidades"
            },
            {
                  "word": "memória",
                  "pos": "substantivo",
                  "definition": "capacidade mental de reter e recordar fatos"
            },
            {
                  "word": "constância",
                  "pos": "substantivo",
                  "definition": "firmeza e perseverança nas atitudes"
            }
      ],
      "hard": [
            {
                  "word": "responsabilidade",
                  "pos": "substantivo",
                  "definition": "obrigação de responder pelos próprios atos"
            },
            {
                  "word": "probabilidade",
                  "pos": "substantivo",
                  "definition": "possibilidade de um acontecimento ocorrer"
            },
            {
                  "word": "independência",
                  "pos": "substantivo",
                  "definition": "liberdade para agir sem controle externo"
            },
            {
                  "word": "perseverança",
                  "pos": "substantivo",
                  "definition": "constância para continuar diante das dificuldades"
            },
            {
                  "word": "extraordinário",
                  "pos": "adjetivo",
                  "definition": "fora do comum ou do habitual"
            },
            {
                  "word": "conhecimento",
                  "pos": "substantivo",
                  "definition": "informação compreendida por uma pessoa"
            },
            {
                  "word": "colaboração",
                  "pos": "substantivo",
                  "definition": "trabalho conjunto para alcançar um objetivo"
            },
            {
                  "word": "criatividade",
                  "pos": "substantivo",
                  "definition": "capacidade de produzir ideias novas"
            },
            {
                  "word": "sustentabilidade",
                  "pos": "substantivo",
                  "definition": "uso equilibrado dos recursos sem esgotá-los"
            },
            {
                  "word": "vulnerabilidade",
                  "pos": "substantivo",
                  "definition": "condição de suscetibilidade a danos ou riscos"
            },
            {
                  "word": "determinação",
                  "pos": "substantivo",
                  "definition": "vontade firme e inabalável de alcançar uma meta"
            },
            {
                  "word": "transcendência",
                  "pos": "substantivo",
                  "definition": "importância que ultrapassa os limites ordinários"
            },
            {
                  "word": "magnanimidade",
                  "pos": "substantivo",
                  "definition": "nobreza e generosidade de espírito"
            },
            {
                  "word": "autenticidade",
                  "pos": "substantivo",
                  "definition": "qualidade de ser genuíno e verdadeiro"
            },
            {
                  "word": "resiliência",
                  "pos": "substantivo",
                  "definition": "capacidade de superar adversidades e se recompor"
            }
      ]
},
    quotes: [
      {
            "id": "bundled-pt-br-1",
            "text": "A prática leva à perfeição.",
            "source": "Dito popular",
            "length": "short"
      },
      {
            "id": "bundled-pt-br-2",
            "text": "Querer é poder.",
            "source": "Provérbio",
            "length": "short"
      },
      {
            "id": "bundled-pt-br-3",
            "text": "Toda jornada começa com um passo.",
            "source": "Provérbio",
            "length": "short"
      },
      {
            "id": "bundled-pt-br-4",
            "text": "O sucesso nasce da constância e do esforço diário.",
            "source": "Dito popular",
            "length": "medium"
      },
      {
            "id": "bundled-pt-br-5",
            "text": "Aprender algo novo todos os dias mantém a curiosidade viva.",
            "source": "Reflexão popular",
            "length": "medium"
      },
      {
            "id": "bundled-pt-br-6",
            "text": "Grandes mudanças começam com uma decisão pequena e corajosa.",
            "source": "Reflexão popular",
            "length": "long"
      },
      {
            "id": "bundled-pt-br-7",
            "text": "Tudo vale a pena se a alma não é pequena.",
            "source": "Fernando Pessoa",
            "length": "short"
      },
      {
            "id": "bundled-pt-br-8",
            "text": "Navegar é preciso; viver não é preciso.",
            "source": "Fernando Pessoa",
            "length": "short"
      },
      {
            "id": "bundled-pt-br-9",
            "text": "O homem é do tamanho do seu sonho.",
            "source": "Fernando Pessoa",
            "length": "short"
      },
      {
            "id": "bundled-pt-br-10",
            "text": "A persistência é o caminho do êxito e da realização dos seus objetivos.",
            "source": "Reflexão popular",
            "length": "medium"
      }
],
  },

  zh: {
    commonWords: [
      "你好",
      "世界",
      "今天",
      "明天",
      "昨天",
      "学习",
      "工作",
      "朋友",
      "家庭",
      "生活",
      "时间",
      "问题",
      "答案",
      "重要",
      "正确",
      "一起",
      "努力",
      "更好",
      "安静",
      "快乐",
      "谢谢",
      "请",
      "书",
      "水",
      "太阳",
      "道路",
      "光明",
      "语言",
      "文字",
      "键盘",
      "练习",
      "速度",
      "开始",
      "希望",
      "未来",
      "学校",
      "老师",
      "学生",
      "知识",
      "思考",
      "发现",
      "成功",
      "耐心",
      "坚持",
      "目标",
      "梦想",
      "勇气",
      "信心",
      "进步",
      "成长",
      "健康",
      "平安",
      "自然",
      "四季",
      "春天",
      "夏天",
      "秋天",
      "冬天",
      "海洋",
      "森林",
      "花朵",
      "雨水",
      "微风",
      "星空",
      "月亮",
      "城市",
      "家园",
      "社会",
      "文化",
      "科学",
      "技术",
      "电脑",
      "网络",
      "创新",
      "合作",
      "分享",
      "理解",
      "尊重",
      "信任",
      "友谊",
      "团结",
      "责任",
      "和平",
      "幸福",
      "温暖",
      "清晨",
      "夜晚",
      "旅途",
      "风景",
      "音乐",
      "艺术",
      "历史",
      "精彩",
      "简单",
      "深刻",
      "真诚",
      "珍惜",
      "积极",
      "充实",
      "理想",
      "成就",
      "辉煌",
      "行动",
      "专注",
      "智慧",
      "探索",
      "突破",
      "追求"
],
    vocab: {
      "easy": [
            {
                  "word": "家",
                  "pos": "名词",
                  "definition": "人们居住和生活的地方"
            },
            {
                  "word": "猫",
                  "pos": "名词",
                  "definition": "一种常见的小型家养动物"
            },
            {
                  "word": "狗",
                  "pos": "名词",
                  "definition": "一种忠诚的家养动物"
            },
            {
                  "word": "树",
                  "pos": "名词",
                  "definition": "有树干和树枝的大型植物"
            },
            {
                  "word": "水",
                  "pos": "名词",
                  "definition": "人和动物生活所需要的透明液体"
            },
            {
                  "word": "朋友",
                  "pos": "名词",
                  "definition": "彼此信任和喜欢的人"
            },
            {
                  "word": "书",
                  "pos": "名词",
                  "definition": "记录文字或图画的成册作品"
            },
            {
                  "word": "太阳",
                  "pos": "名词",
                  "definition": "给地球带来光和热的恒星"
            },
            {
                  "word": "月亮",
                  "pos": "名词",
                  "definition": "夜空中围绕地球旋转的天体"
            },
            {
                  "word": "花",
                  "pos": "名词",
                  "definition": "种子植物的有性繁殖器官，通常美丽有香气"
            },
            {
                  "word": "草",
                  "pos": "名词",
                  "definition": "茎干柔软的小型植物"
            },
            {
                  "word": "鸟",
                  "pos": "名词",
                  "definition": "有羽毛并通常能飞行动物"
            },
            {
                  "word": "鱼",
                  "pos": "名词",
                  "definition": "生活在水中用鳃呼吸的脊椎动物"
            },
            {
                  "word": "雨",
                  "pos": "名词",
                  "definition": "从云层降落到地面的水滴"
            },
            {
                  "word": "风",
                  "pos": "名词",
                  "definition": "空气流动的自然现象"
            },
            {
                  "word": "火",
                  "pos": "名词",
                  "definition": "物体燃烧时发光发热的现象"
            },
            {
                  "word": "天",
                  "pos": "名词",
                  "definition": "地球表面之上的广阔空间"
            },
            {
                  "word": "地",
                  "pos": "名词",
                  "definition": "人类生活的陆地表面"
            },
            {
                  "word": "门",
                  "pos": "名词",
                  "definition": "房屋或房间进出的通道设施"
            },
            {
                  "word": "窗",
                  "pos": "名词",
                  "definition": "墙上用于通风采光的开口"
            },
            {
                  "word": "车",
                  "pos": "名词",
                  "definition": "陆地上用来运输人员或货物的交通工具"
            },
            {
                  "word": "路",
                  "pos": "名词",
                  "definition": "供行人或车辆通行的道"
            },
            {
                  "word": "手",
                  "pos": "名词",
                  "definition": "人体上肢前端的抓握器官"
            },
            {
                  "word": "心",
                  "pos": "名词",
                  "definition": "推动血液循环的器官，也指思想情感"
            },
            {
                  "word": "山",
                  "pos": "名词",
                  "definition": "地面上显著隆起的高耸部分"
            }
      ],
      "medium": [
            {
                  "word": "惊喜",
                  "pos": "名词",
                  "definition": "意料之外的快乐或发现"
            },
            {
                  "word": "想法",
                  "pos": "名词",
                  "definition": "人在头脑中形成的意见或念头"
            },
            {
                  "word": "工具",
                  "pos": "名词",
                  "definition": "帮助人完成工作的器具"
            },
            {
                  "word": "进步",
                  "pos": "名词",
                  "definition": "能力或情况逐渐变好"
            },
            {
                  "word": "习惯",
                  "pos": "名词",
                  "definition": "长期重复形成的行为方式"
            },
            {
                  "word": "注意",
                  "pos": "名词",
                  "definition": "把心思集中在某件事情上"
            },
            {
                  "word": "信任",
                  "pos": "名词",
                  "definition": "相信别人可靠而值得依靠"
            },
            {
                  "word": "速度",
                  "pos": "名词",
                  "definition": "物体移动快慢的程度"
            },
            {
                  "word": "希望",
                  "pos": "名词",
                  "definition": "对美好未来的期盼与渴望"
            },
            {
                  "word": "努力",
                  "pos": "名词",
                  "definition": "尽最大的力量去完成目标"
            },
            {
                  "word": "勇气",
                  "pos": "名词",
                  "definition": "面对困难毫不畏惧的气魄"
            },
            {
                  "word": "耐心",
                  "pos": "名词",
                  "definition": "心里不急躁且能坚持的品质"
            },
            {
                  "word": "准备",
                  "pos": "名词",
                  "definition": "为开展某项事情预先做的工作"
            },
            {
                  "word": "机会",
                  "pos": "名词",
                  "definition": "适合达成目标的良好时机"
            },
            {
                  "word": "健康",
                  "pos": "形容词",
                  "definition": "身体和心理状况健全良好"
            },
            {
                  "word": "平安",
                  "pos": "形容词",
                  "definition": "平静稳定而没有事故危险"
            },
            {
                  "word": "温暖",
                  "pos": "形容词",
                  "definition": "令人感到舒适温和的气候或关怀"
            },
            {
                  "word": "精彩",
                  "pos": "形容词",
                  "definition": "出色奇妙而引人入胜"
            },
            {
                  "word": "专注",
                  "pos": "形容词",
                  "definition": "专心致志而不受外界干扰"
            },
            {
                  "word": "合作",
                  "pos": "名词",
                  "definition": "为共同目标互相配合完成工作"
            },
            {
                  "word": "选择",
                  "pos": "名词",
                  "definition": "在多种可能中挑出适合的一个"
            },
            {
                  "word": "支持",
                  "pos": "名词",
                  "definition": "给予鼓励、帮助或赞同"
            },
            {
                  "word": "理解",
                  "pos": "名词",
                  "definition": "懂得意图、道理并产生共情"
            },
            {
                  "word": "珍惜",
                  "pos": "动词",
                  "definition": "重视并爱护有价值的人或事物"
            },
            {
                  "word": "成长",
                  "pos": "名词",
                  "definition": "由幼稚向成熟发展的自然过程"
            }
      ],
      "hard": [
            {
                  "word": "责任",
                  "pos": "名词",
                  "definition": "应当承担的任务和义务"
            },
            {
                  "word": "可能性",
                  "pos": "名词",
                  "definition": "事情有机会发生的程度"
            },
            {
                  "word": "独立",
                  "pos": "形容词",
                  "definition": "不依靠别人或外部力量"
            },
            {
                  "word": "坚持不懈",
                  "pos": "形容词",
                  "definition": "持续努力而不轻易放弃"
            },
            {
                  "word": "非凡",
                  "pos": "形容词",
                  "definition": "超过平常而特别出色"
            },
            {
                  "word": "知识",
                  "pos": "名词",
                  "definition": "通过学习和经验获得的认识"
            },
            {
                  "word": "合作精神",
                  "pos": "名词",
                  "definition": "在团队中共同奋斗的思想品质"
            },
            {
                  "word": "创造力",
                  "pos": "名词",
                  "definition": "产生新想法和新作品的能力"
            },
            {
                  "word": "坚定不移",
                  "pos": "形容词",
                  "definition": "信念十分坚固决不改变"
            },
            {
                  "word": "深谋远虑",
                  "pos": "形容词",
                  "definition": "周密谋划并为长远打算"
            },
            {
                  "word": "宽容大度",
                  "pos": "形容词",
                  "definition": "胸怀开阔能包容别人的过错"
            },
            {
                  "word": "持之以恒",
                  "pos": "形容词",
                  "definition": "长久坚持下去毫不松懈"
            },
            {
                  "word": "自强不息",
                  "pos": "形容词",
                  "definition": "自己努力向上绝不停止"
            },
            {
                  "word": "厚积薄发",
                  "pos": "形容词",
                  "definition": "蓄积深厚而从容施展出来"
            },
            {
                  "word": "循序渐进",
                  "pos": "形容词",
                  "definition": "按一定的顺序和步骤逐渐深入"
            },
            {
                  "word": "融会贯通",
                  "pos": "形容词",
                  "definition": "将各方面知识融合并彻底理解"
            },
            {
                  "word": "勇往直前",
                  "pos": "形容词",
                  "definition": "勇敢地一直向前绝不后退"
            },
            {
                  "word": "迎难而上",
                  "pos": "形容词",
                  "definition": "哪怕遇到困难也主动面对解决"
            },
            {
                  "word": "实事求是",
                  "pos": "形容词",
                  "definition": "从实际出发去探求客观规律"
            },
            {
                  "word": "精益求精",
                  "pos": "形容词",
                  "definition": "已经很好了还力求更加完美"
            },
            {
                  "word": "脚踏实地",
                  "pos": "形容词",
                  "definition": "做事踏实认真而不浮躁夸张"
            },
            {
                  "word": "居安思危",
                  "pos": "形容词",
                  "definition": "处在平安环境仍警惕潜在危险"
            },
            {
                  "word": "高瞻远瞩",
                  "pos": "形容词",
                  "definition": "站得高看得远具有远大眼光"
            },
            {
                  "word": "返璞归真",
                  "pos": "形容词",
                  "definition": "回到最初质朴纯真本来的状态"
            },
            {
                  "word": "同舟共济",
                  "pos": "形容词",
                  "definition": "在同一条船上共同战胜风浪"
            }
      ]
},
    quotes: [
      {
            "id": "bundled-zh-1",
            "text": "千里之行，始于足下。",
            "source": "《老子·道德经》",
            "length": "short"
      },
      {
            "id": "bundled-zh-2",
            "text": "有志者，事竟成。",
            "source": "《后汉书》",
            "length": "short"
      },
      {
            "id": "bundled-zh-3",
            "text": "熟能生巧。",
            "source": "中国成语",
            "length": "short"
      },
      {
            "id": "bundled-zh-4",
            "text": "温故而知新，可以为师矣。",
            "source": "《论语·为政》",
            "length": "short"
      },
      {
            "id": "bundled-zh-5",
            "text": "学而不思则罔，思而不学则殆。",
            "source": "《论语·为政》",
            "length": "medium"
      },
      {
            "id": "bundled-zh-6",
            "text": "不积跬步，无以至千里；不积小流，无以成江海。",
            "source": "《荀子·劝学》",
            "length": "medium"
      },
      {
            "id": "bundled-zh-7",
            "text": "非淡泊无以明志，非宁静无以致远。",
            "source": "诸葛亮《诫子书》",
            "length": "medium"
      },
      {
            "id": "bundled-zh-8",
            "text": "业精于勤，荒于嬉；行成于思，毁于随。",
            "source": "韩愈《进学解》",
            "length": "medium"
      },
      {
            "id": "bundled-zh-9",
            "text": "每一次练习都会让今天的自己更进一步。",
            "source": "学习格言",
            "length": "medium"
      },
      {
            "id": "bundled-zh-10",
            "text": "海纳百川，有容乃大；壁立千仞，无欲则刚。",
            "source": "林则徐",
            "length": "medium"
      },
      {
            "id": "bundled-zh-11",
            "text": "真正的进步来自耐心、专注和持续的努力。",
            "source": "学习格言",
            "length": "medium"
      },
      {
            "id": "bundled-zh-12",
            "text": "路漫漫其修远兮，吾将上下而求索。",
            "source": "屈原《离骚》",
            "length": "long"
      },
      {
            "id": "bundled-zh-13",
            "text": "其实地上本没有路，走的人多了，也便成了路。",
            "source": "鲁迅《故乡》",
            "length": "long"
      },
      {
            "id": "bundled-zh-14",
            "text": "只要坚持学习并且勇于尝试，平凡的积累也能带来不平凡的改变。",
            "source": "学习格言",
            "length": "long"
      },
      {
            "id": "bundled-zh-15",
            "text": "博学之，审问之，慎思之，明辨之，笃行之。",
            "source": "《礼记·中庸》",
            "length": "long"
      },
      {
            "id": "bundled-zh-16",
            "text": "在漫长的道路上，每一个认真完成的小步骤，都会把我们带向更好的未来。",
            "source": "学习格言",
            "length": "long"
      },
      {
            "id": "bundled-zh-17",
            "text": "当困难让人想要停下时，耐心和持续练习往往正是走向成功的关键。",
            "source": "学习格言",
            "length": "long"
      }
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
