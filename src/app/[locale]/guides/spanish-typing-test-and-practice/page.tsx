import type { Metadata } from "next";
import Link from "next/link";
import { GuideLayout } from "@/components/content/guide-layout";
import { Callout } from "@/components/content/callout";
import { FaqSection } from "@/components/content/faq-section";
import { buildArticleSchema } from "@/lib/seo/json-ld";
import { pageMetadata } from "@/lib/seo/metadata";
import { SITE_NAME } from "@/lib/seo/constants";

export const metadata: Metadata = pageMetadata({
  title: "Test de Mecanografía y Práctica en Teclado Español: Guía de Velocidad y Acentos",
  description:
    "Aprende mecanografía en español: domina la tecla Ñ, acentos con teclas muertas, signos invertidos (¡, ¿), cálculo de palabras por minuto (PPM) y preparación para oposiciones.",
  path: "/guides/spanish-typing-test-and-practice",
});

const PUBLISHED = "2026-10-13";
const UPDATED = "2026-10-13";

const EJEMPLOS_ES = [
  {
    nivel: "Principiante (25–35 PPM)",
    nota: "Palabras cortas, vocabulario común, sin acentos complejos.",
    texto: "El sol de la mañana brillaba sobre el tejado rojo. Todos los amigos salieron al parque a caminar en silencio.",
  },
  {
    nivel: "Intermedio (40–60 PPM)",
    nota: "Acentos ortográficos frecuentes, letra Ñ, signos de coma y punto.",
    texto: "Aunque el año pasado fue difícil para el sector tecnológico, la pequeña empresa logró diseñar una solución rápida y eficaz que transformó la productividad del equipo.",
  },
  {
    nivel: "Avanzado y Oposiciones (65–85+ PPM)",
    nota: "Signos invertidos (¡, ¿), números, diéresis y subordinación compleja.",
    texto: "¿Quién habría imaginado en 2024 que la resolución número 43/B —aprobada con reservas lingüísticas— exigiría tanta precisión técnica para evitar objeciones formales? ¡Jamás fue tan urgente verificar cada cláusula!",
  },
];

const BAREMOS_ESPANA_LATAM = [
  { categoria: "Iniciación / Aficionado", velocidad: "20–35 PPM", descripcion: "Usuarios que buscan teclas mirando el teclado o mecanógrafos novatos." },
  { categoria: "Promedio Adulto", velocidad: "40–50 PPM", descripcion: "Velocidad estándar en tareas de oficina, correo electrónico y redacción cotidiana." },
  { categoria: "Administrativo Competente", velocidad: "55–70 PPM", descripcion: "Nivel recomendado para puestos de secretaría, atención al cliente y transcripción." },
  { categoria: "Oposiciones / Profesional", velocidad: "75–100+ PPM", descripcion: "Exigencia para pruebas de administrativo del Estado, justicia y mecanografía de élite." },
];

const FAQ_ITEMS = [
  {
    question: "¿Qué significan PPM y WPM en mecanografía en español?",
    answer:
      "PPM significa 'Palabras Por Minuto' y es la traducción directa de WPM ('Words Per Minute'). En las pruebas estandarizadas internacionales y en el sistema de HeroTyping, una palabra estándar equivale exactamente a cinco pulsaciones o caracteres (incluyendo espacios y signos de puntuación). En algunos ámbitos también se mide en pulsaciones por minuto (Pulsaciones = PPM x 5).",
    plainAnswer:
      "PPM son Palabras Por Minuto (equivalente a WPM). Una palabra estándar equivale a cinco pulsaciones en el teclado.",
  },
  {
    question: "¿Cómo se escriben los acentos y la letra Ñ sin perder velocidad?",
    answer:
      "La tecla Ñ se presiona directamente con el dedo meñique derecho en la fila guía (a la derecha de la L). Para los acentos (á, é, í, ó, ú), el teclado en español utiliza una 'tecla muerta': se pulsa primero la tecla de tilde (a la derecha de la P) y luego la vocal correspondiente, sin espacio intermedio. Mantener el meñique relajado en la fila guía es el secreto para no tropezar al acentuar.",
    plainAnswer:
      "La Ñ se pulsa con el meñique derecho en la fila guía. El acento se pulsa con la tecla al lado de la P y luego la vocal deseada.",
  },
  {
    question: "¿Qué velocidad de mecanografía exigen en las oposiciones en España y Latinoamérica?",
    answer:
      "En España, oposiciones como Auxiliar Administrativo del Estado o Tramitación Procesal suelen requerir entre 250 y 350 pulsaciones por minuto netas (aproximadamente 50 a 70 PPM netas), con una penalización muy estricta por faltas ortográficas o caracteres omitidos. En Latinoamérica, las pruebas de ingreso al poder judicial y secretarías solicitan entre 45 y 65 PPM con un 95% mínimo de precisión.",
    plainAnswer:
      "Suelen exigir entre 250 y 350 pulsaciones por minuto (50–70 PPM) con un estándar de precisión superior al 95%.",
  },
  {
    question: "¿Cuál es la diferencia entre el teclado de España (ISO) y el teclado latinoamericano?",
    answer:
      "Ambos incluyen la letra Ñ, pero cambian la ubicación de caracteres especiales como el arroba (@), corchetes y signos de interrogación. En el teclado de España, el arroba se obtiene con AltGr + 2, mientras que en el teclado latinoamericano se suele ubicar con AltGr + Q. El test de HeroTyping procesa el carácter final ingresado de forma agnóstica para garantizar una experiencia justa en ambas regiones.",
    plainAnswer:
      "Ambos poseen la letra Ñ pero difieren en combinaciones con AltGr (@, corchetes). HeroTyping evalúa el texto de manera compatible con ambos.",
  },
];

export default function SpanishTypingTestPage() {
  const schema = buildArticleSchema({
    headline: "Test de Mecanografía y Práctica en Teclado Español: Guía de Velocidad y Acentos",
    description:
      "Guía integral de mecanografía en español: cómo dominar la tecla Ñ, acentos con teclas muertas, signos invertidos y baremos de velocidad para oposiciones.",
    path: "/guides/spanish-typing-test-and-practice",
    datePublished: PUBLISHED,
  });

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <GuideLayout
        title="Test de Mecanografía y Práctica en Teclado Español"
        subtitle="Domina la mecanografía al tacto en español: velocidad en palabras por minuto (PPM), colocación de dedos para la letra Ñ, acentuación fluida y entrenamiento para oposiciones."
        breadcrumbItems={[
          { name: "Guides", path: "/guides" },
          { name: "Mecanografía en Español", path: "/guides/spanish-typing-test-and-practice" },
        ]}
        toc={[
          { id: "que-mide", label: "¿Qué mide el test?" },
          { id: "tecla-n-acentos", label: "La letra Ñ y acentos" },
          { id: "signos-invertidos", label: "Signos invertidos (¡, ¿)" },
          { id: "baremos-velocidad", label: "Baremos de velocidad" },
          { id: "oposiciones", label: "Mecanografía para oposiciones" },
          { id: "textos-ejemplo", label: "Textos de práctica por nivel" },
          { id: "entrenamiento-practico", label: "Cómo practicar gratis" },
        ]}
        hasFaq
      >
        <Callout label="Resumen Clave">
          <p>
            Un test de mecanografía en español evalúa tu velocidad en palabras por minuto (PPM) y tu precisión al transcribir prosa real.
            Escribir rápido en español requiere dominar la tecla <strong>Ñ</strong> con el meñique derecho, la tecla muerta del acento
            ortográfico y los signos invertidos (<strong>¿</strong>, <strong>¡</strong>) sin mirar el teclado.
          </p>
        </Callout>

        <p>
          La mecanografía al tacto (*touch typing*) es una de las habilidades profesionales más rentables y universales.
          En el mundo hispanohablante—desde España hasta México, Colombia, Argentina y Chile—miles de estudiantes y profesionales
          utilizan el teclado a diario, pero la mayoría arrastra el hábito de &ldquo;cazar teclas&rdquo; con dos o cuatro dedos.
          Aprender a escribir con los diez dedos permite duplicar o triplicar la velocidad de redacción sin fatiga muscular.
        </p>

        <h2 id="que-mide">¿Qué mide un test de mecanografía en español?</h2>
        <p>
          En la plataforma de {SITE_NAME}, la prueba de mecanografía evalúa tres métricas objetivas:
        </p>
        <ul>
          <li>
            <strong>Palabras por Minuto (PPM / WPM):</strong> Calculadas bajo la fórmula internacional estándar de cinco pulsaciones
            por palabra (incluyendo espacios entre palabras y signos de puntuación). Consulta la{" "}
            <Link href="/guides/net-wpm-vs-gross-wpm">fórmula de PPM bruta y neta</Link> para entender el desglose matemático.
          </li>
          <li>
            <strong>Porcentaje de Precisión (%):</strong> La proporción de caracteres acertados al primer intento. En español,
            la precisión es aún más crítica que en inglés debido a que un error en un acento ortográfico o en una coma cambia el sentido gramatical.
          </li>
          <li>
            <strong>Consistencia del Ritmo:</strong> Mide la estabilidad de tus pulsaciones para evitar bloqueos bruscos al llegar a palabras largas.
          </li>
        </ul>

        <h2 id="tecla-n-acentos">La letra Ñ y el dominio de los acentos ortográficos</h2>
        <p>
          La particularidad más notable del teclado en español frente al estándar anglosajón radica en la fila guía derecha y en las vocales tildadas:
        </p>
        <ul>
          <li>
            <strong>Ubicación de la Ñ:</strong> En la fila guía (*ASDF JKLÑ*), el dedo <strong>meñique derecho</strong> descansa de forma
            natural sobre la tecla <strong>Ñ</strong> (al lado de la L). Jamás desplaces toda la mano para pulsarla; el movimiento debe ser
            un microgiro del meñique. Consulta nuestro mapa interactivo en la{" "}
            <Link href="/guides/touch-typing-finger-map">guía de colocación de dedos</Link>.
          </li>
          <li>
            <strong>Tildes con tecla muerta (á, é, í, ó, ú):</strong> En los teclados en español, el acento ortográfico no es una tecla compuesta
            con Shift. Se presiona la tecla de tilde (a la derecha de la letra P con el meñique derecho) y acto seguido la vocal deseada.
            El error más común de los novatos es dudar entre la tilde y la vocal: ambas teclas deben fluir como un único acorde de dos tiempos.
          </li>
          <li>
            <strong>Diéresis (ü):</strong> Se activa pulsando Shift + tecla de tilde, seguido de la letra U (por ejemplo en &ldquo;bilingüe&rdquo;
            o &ldquo;antigüedad&rdquo;).
          </li>
        </ul>

        <h2 id="signos-invertidos">Signos ortográficos invertidos (¡, ¿)</h2>
        <p>
          El español es el único idioma romance que utiliza signos de apertura para interrogaciones (<strong>¿</strong>) y exclamaciones
          (<strong>¡</strong>).
        </p>
        <ul>
          <li>
            El signo de apertura de exclamación (<strong>¡</strong>) suele encontrarse en la fila superior (junto al cero o borrar).
          </li>
          <li>
            El signo de apertura de interrogación (<strong>¿</strong>) se activa con Shift en la fila superior derecha.
          </li>
          <li>
            Dominar estos caracteres sin mirar el teclado es indispensable para redactores, abogados y aspirantes a oposiciones,
            donde omitir el signo inicial descuenta puntos en las pruebas oficiales.
          </li>
        </ul>

        <h2 id="baremos-velocidad">Baremos de velocidad de escritura en español</h2>
        <p>
          ¿Cuál es una buena velocidad de mecanografía en español? Estos son los estándares medidos en el mercado hispanohablante:
        </p>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-border text-sub font-mono uppercase">
                <th className="py-2.5 pr-4">Nivel de Habilidad</th>
                <th className="py-2.5 pr-4">Velocidad (PPM)</th>
                <th className="py-2.5">Contexto Práctico</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {BAREMOS_ESPANA_LATAM.map((b) => (
                <tr key={b.categoria} className="hover:bg-sub-alt/20">
                  <td className="py-2.5 pr-4 font-semibold text-foreground">{b.categoria}</td>
                  <td className="py-2.5 pr-4 font-mono text-accent">{b.velocidad}</td>
                  <td className="py-2.5 text-foreground/80">{b.descripcion}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <h2 id="oposiciones">Mecanografía para oposiciones y empleo administrativo</h2>
        <p>
          En España y en varios países de América Latina, las convocatorias de empleo público (oposiciones de Auxiliar Administrativo,
          Justicia, Secretariado y Atención al Ciudadano) incluyen una prueba práctica eliminatoria de mecanografía o tratamiento de textos:
        </p>
        <ul>
          <li>
            <strong>Penalizaciones severas:</strong> En estas convocatorias, cada error suele descontar entre 3 y 5 palabras correctas.
            Escribir a 70 PPM con un 90% de precisión te dejará fuera del baremo, mientras que 60 PPM con un 98% de precisión obtiene plaza.
          </li>
          <li>
            <strong>Sin marcha atrás:</strong> Muchas pruebas bloquean la tecla de retroceso (*Backspace*). En {SITE_NAME}, puedes entrenar
            la calma mental y la precisión visual en nuestra{" "}
            <Link href="/guides/how-to-improve-typing-accuracy">guía de precisión de mecanografía</Link>.
          </li>
        </ul>

        <h2 id="textos-ejemplo">Textos de práctica recomendados por nivel</h2>
        <p>
          Utiliza estos tres fragmentos para evaluar la fluidez con la que encadenas sílabas y acentos en tu teclado:
        </p>
        <div className="flex flex-col gap-3.5">
          {EJEMPLOS_ES.map((ej) => (
            <div key={ej.nivel} className="theme-transition rounded-xl border border-border bg-sub-alt/20 p-4">
              <p className="font-mono text-xs font-semibold uppercase tracking-wider text-accent">
                {ej.nivel}
              </p>
              <p className="mt-1 text-xs text-sub/80">{ej.nota}</p>
              <p className="mt-2 text-sm leading-relaxed text-foreground font-mono bg-bg/50 p-2.5 rounded-lg border border-border/40">
                {ej.texto}
              </p>
            </div>
          ))}
        </div>

        <h2 id="entrenamiento-practico">Cómo practicar gratis y medir tu progreso</h2>
        <p>
          La mejor forma de automatizar el teclado en español es la práctica diaria breve y deliberada:
        </p>
        <ol className="list-decimal space-y-2 pl-5 text-foreground/90">
          <li>
            <strong>Realiza un test cronometrado:</strong> Entra en nuestro{" "}
            <Link href="/es">test de mecanografía en español</Link> y mide tu velocidad base en 60 segundos con palabras reales.
          </li>
          <li>
            <strong>Prueba con textos propios:</strong> Copia artículos periodísticos o temas de oposición en el{" "}
            <Link href="/typing-test/custom-text">test con texto personalizado</Link>.
          </li>
          <li>
            <strong>Corrige dedos débiles:</strong> Si tus errores se concentran en la Ñ o la P, refuerza la musculatura en el{" "}
            <Link href="/practice/weak-keys">laboratorio de teclas difíciles</Link>.
          </li>
          <li>
            <strong>Calcula tus pulsaciones:</strong> Si tu convocatoria mide en pulsaciones por minuto, conviértelas al instante con la{" "}
            <Link href="/guides/wpm-cpm-kph-calculator">calculadora de PPM y pulsaciones</Link>.
          </li>
        </ol>

        <FaqSection items={FAQ_ITEMS} />

        <p className="text-xs text-sub">Última actualización: {UPDATED}.</p>
      </GuideLayout>
    </>
  );
}
