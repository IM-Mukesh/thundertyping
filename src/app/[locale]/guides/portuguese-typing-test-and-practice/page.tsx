import type { Metadata } from "next";
import Link from "next/link";
import { GuideLayout } from "@/components/content/guide-layout";
import { SourceList } from "@/components/content/source-list";
import { Callout } from "@/components/content/callout";
import { FaqSection } from "@/components/content/faq-section";
import { buildArticleSchema } from "@/lib/seo/json-ld";
import { pageMetadata } from "@/lib/seo/metadata";
import { SITE_NAME } from "@/lib/seo/constants";

export const metadata: Metadata = pageMetadata({
  title: "Teste de Digitação em Português",
  description:
    "Aprenda digitação rápida em português: domine o teclado ABNT2 com cedilha (ç), acentuação (til ~, agudo, circunflexo), toques por minuto (TPM) e concursos públicos.",
  path: "/guides/portuguese-typing-test-and-practice",
});

const PUBLISHED = "2026-10-13";
const UPDATED = "2026-10-13";

const EXEMPLOS_PT = [
  {
    nivel: "Iniciante (20–35 PPM / 100–175 TPM)",
    nota: "Palavras curtas e comuns, vocabulário do dia a dia, pontuação básica.",
    texto: "O dia estava quente e o vento soprava suave pela janela da sala. Todos os amigos caminharam juntos até a praia em silêncio.",
  },
  {
    nivel: "Intermediário (40–60 PPM / 200–300 TPM)",
    nota: "Cedilha (ç), til (~), acentos agudo e circunflexo, orações subordinadas.",
    texto: "Embora a produção no último trimestre tenha enfrentado grandes oscilações econômicas, a equipe de tecnologia conseguiu entregar uma solução ágil e de alta precisão que agradou à direção.",
  },
  {
    nivel: "Avançado & Concursos Públicos (65–85+ PPM / 325–425+ TPM)",
    nota: "Crase (`), aspas, números, termos jurídicos e vocabulário formal denso.",
    texto: "Em provas práticas de concursos públicos judiciais (como os cargos de Escrevente Técnico do TJSP e cartórios), a avaliação exige cópia fidedigna com ritmo constante em teclado ABNT2, onde erros de pontuação, espaçamento e concordância acarretam desconto direto na pontuação líquida!",
  },
];

const BAREMOS_BRASIL = [
  { nivel: "Iniciante / 'Catador de Milho'", tpm: "80–160 TPM", ppm: "16–32 PPM", contexto: "Pessoas que olham constantemente para as teclas e usam apenas 2 a 4 dedos." },
  { nivel: "Média Nacional / Dia a Dia", tpm: "180–240 TPM", ppm: "36–48 PPM", contexto: "Velocidade padrão de quem trabalha com e-mails, relatórios simples e atendimento." },
  { nivel: "Digitador Ágil / Escritório", tpm: "260–340 TPM", ppm: "52–68 PPM", contexto: "Excelente ritmo para assistentes administrativos, programadores e secretariado." },
  { nivel: "Exigência de Concursos Públicos", tpm: "350–450+ TPM", ppm: "70–90+ PPM", contexto: "Índice necessário para aprovação na prova prática de tribunais (TJSP, TRTs) e cartórios." },
];

const FAQ_ITEMS = [
  {
    question: "O que significa TPM e como converter para Palavras por Minuto (PPM / WPM)?",
    answer:
      "TPM significa 'Toques Por Minuto', sendo a métrica oficial mais utilizada em editais de concursos públicos no Brasil. Cada tecla pressionada (incluindo letras, espaços, acentos e pontuação) conta como 1 toque. No padrão internacional de digitação (WPM / PPM), adota-se a convenção de 5 toques para formar uma palavra padrão. Portanto, a fórmula de conversão é: PPM = TPM ÷ 5. Se você digita 250 TPM, sua velocidade é de 50 PPM.",
    plainAnswer:
      "TPM são Toques Por Minuto. Para converter para PPM (Palavras por Minuto), divida por 5 (ex: 300 TPM = 60 PPM).",
  },
  {
    question: "O que muda no teclado padrão brasileiro ABNT2?",
    answer:
      "O teclado ABNT2 (Associação Brasileira de Normas Técnicas) possui duas características essenciais exclusivas: a tecla de cedilha (Ç) dedicada na linha base (ao lado da tecla L, operada pelo dedo mindinho direito) e a tecla AltGr (Alt da direita), que permite acessar terceiros caracteres como ², ³, ª, º e §. No HeroTyping, nosso motor aceita perfeitamente as entradas do ABNT2 e teclados internacionais.",
    plainAnswer:
      "O ABNT2 tem a tecla Ç na linha base e a tecla AltGr para símbolos especiais (como ², ³, ª, º).",
  },
  {
    question: "Como funciona a acentuação (til, agudo, circunflexo e crase) no teclado?",
    answer:
      "No português, os acentos utilizam o conceito de 'tecla morta': você pressiona primeiro a tecla do acento e, em seguida, a vogal correspondente. Para o til (~) e circunflexo (^), a tecla fica à direita do teclado. Para o agudo (´) e a crase (`), usa-se a tecla dedicada ao lado da letra P. Nunca aperte a barra de espaço após o acento, senão o caractere sairá isolado.",
    plainAnswer:
      "Aperte primeiro a tecla do acento e depois a vogal desejada, sem apertar a barra de espaço entre elas.",
  },
  {
    question: "Como é a prova de digitação do concurso do Tribunal de Justiça (TJSP)?",
    answer:
      "A prova prática para cargos como Escrevente Técnico Judiciário do TJSP normalmente avalia a digitação de texto em computador com teclado padrão ABNT2, exigindo atingir uma pontuação líquida mínima estipulada em edital (geralmente entre 150 e 200 TPM líquidos mínimos para aprovação, com penalização estrita por erros de pontuação, letras trocadas ou caracteres omitidos).",
    plainAnswer:
      "Avalia a cópia em computador com teclado ABNT2, calculando toques líquidos com penalidade estrita para cada caractere errado ou omitido.",
  },
];

export default function PortugueseTypingTestPage() {
  const schema = buildArticleSchema({
    headline: "Teste de Digitação e Prática: Guia Completo para Teclado ABNT2",
    description:
      "Guia completo de digitação rápida no Brasil: teclado ABNT2 com cedilha (ç), acentuação, toques por minuto (TPM) e preparação para concursos públicos.",
    path: "/guides/portuguese-typing-test-and-practice",
    datePublished: PUBLISHED,
    inLanguage: "pt-BR",
  });

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <GuideLayout
        lang="pt-BR"
        title="Teste de Digitação e Prática (Teclado ABNT2)"
        subtitle="Aprenda a digitar com todos os dedos sem olhar para o teclado: toques por minuto (TPM), domínio da cedilha (ç), acentuação ágil e preparação para concursos."
        breadcrumbItems={[
          { name: "Guides", path: "/guides" },
          { name: "Digitação em Português (ABNT2)", path: "/guides/portuguese-typing-test-and-practice" },
        ]}
        toc={[
          { id: "o-que-mede", label: "O que mede o teste?" },
          { id: "teclado-abnt2", label: "O Teclado ABNT2 e o Ç" },
          { id: "regras-acentuacao", label: "Regras de acentuação" },
          { id: "baremos-brasil", label: "Baremos de velocidade (TPM)" },
          { id: "concursos-publicos", label: "Digitação para concursos" },
          { id: "textos-treino", label: "Textos de treino por nível" },
          { id: "treinamento-diario", label: "Como treinar no HeroTyping" },
        ]}
        hasFaq
      >
        <Callout label="Resumo Direto">
          <p>
            Um teste de digitação em português avalia sua agilidade em <strong>Palavras por Minuto (PPM / WPM)</strong> e em{" "}
            <strong>Toques por Minuto (TPM)</strong>. No Brasil, dominar o teclado <strong>ABNT2</strong> com o dedo mindinho
            na tecla <strong>Ç</strong> e automatizar os acentos é a chave para ser aprovado em concursos e trabalhar com máxima produtividade.
          </p>
        </Callout>

        <p>
          Parar de &ldquo;catar milho&rdquo; (digitar olhando para as teclas com apenas dois dedos) transforma a rotina de qualquer profissional.
          Quando você aprende a digitar pelo método do toque (*touch typing*), seu cérebro foca no conteúdo da redação, enquanto suas mãos
          executam os movimentos de forma subconsciente e fluida.
        </p>

        <h2 id="o-que-mede">O que mede um teste de digitação em português?</h2>
        <p>
          No {SITE_NAME}, o teste mede com precisão milimétrica o desempenho das suas mãos:
        </p>
        <ul>
          <li>
            <strong>Toques por Minuto (TPM) & Palavras por Minuto (PPM):</strong> No Brasil, editais públicos medem em toques,
            onde cada 5 toques equivalem a 1 palavra padrão. Para converter seus resultados instantaneamente, use nossa{" "}
            <Link href="/guides/wpm-cpm-kph-calculator">calculadora de WPM, PPM e Toques por Minuto</Link>.
          </li>
          <li>
            <strong>Precisão (%):</strong> A porcentagem de teclas corretas digitadas de primeira. Erros exigem o uso do Backspace,
            que corta o ritmo motor pela metade. Saiba mais em nosso guia de{" "}
            <Link href="/guides/how-to-improve-typing-accuracy">precisão na digitação</Link>.
          </li>
          <li>
            <strong>Constância e Ritmo:</strong> A cadência uniforme ao digitar frases longas sem pausas bruscas em palavras complexas.
          </li>
        </ul>

        <h2 id="teclado-abnt2">O padrão brasileiro ABNT2 e a tecla Ç</h2>
        <p>
          O padrão nacional brasileiro é o ABNT2, projetado especialmente para a morfologia da língua portuguesa:
        </p>
        <ul>
          <li>
            <strong>A Linha Base (*Home Row*):</strong> A posição de descanso das suas mãos é: mão esquerda sobre as teclas{" "}
            <strong>A – S – D – F</strong>; mão direita sobre as teclas <strong>J – K – L – Ç</strong>.
            Os dedos indicadores encontram os pequenos relevos táteis em <strong>F</strong> e <strong>J</strong>.
            Confira o mapa completo em nosso{" "}
            <Link href="/guides/touch-typing-finger-map">mapa de dedos para digitação</Link>.
          </li>
          <li>
            <strong>A Tecla Cedilha (Ç):</strong> Fica posicionada sob o <strong>dedo mindinho direito</strong>.
            Ao contrário dos teclados americanos onde se usa a combinação de apóstrofo e letra C, no ABNT2 a tecla Ç é direta.
          </li>
        </ul>

        <h2 id="regras-acentuacao">Regras de acentuação sem perda de velocidade</h2>
        <p>
          A língua portuguesa possui uma das maiores variedades de acentos gráficos entre as línguas latinas:
        </p>
        <ul>
          <li>
            <strong>Til (~) e Circunflexo (^):</strong> Pressione a tecla do til (ao lado do Ç ou próximo ao Enter) e depois a vogal
            (ex: <em>não</em>, <em>coração</em>). Para o circunflexo, use Shift + tecla do til seguido da vogal (ex: <em>você</em>, <em>avô</em>).
          </li>
          <li>
            <strong>Agudo (´) e Crase (`):</strong> A tecla fica ao lado da letra P. Aperte a tecla e em seguida a vogal para o agudo
            (ex: <em>água</em>, <em>café</em>). Para a crase, use Shift + tecla de agudo seguido da letra A (ex: <em>à vista</em>).
          </li>
        </ul>

        <h2 id="baremos-brasil">Baremos de velocidade no Brasil (TPM e PPM)</h2>
        <p>
          Confira como sua velocidade atual se compara à média dos usuários e profissionais no Brasil:
        </p>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-border text-sub font-mono uppercase">
                <th className="py-2.5 pr-4">Faixa de Habilidade</th>
                <th className="py-2.5 pr-4">Toques (TPM)</th>
                <th className="py-2.5 pr-4">Palavras (PPM)</th>
                <th className="py-2.5">Perfil de Aplicação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {BAREMOS_BRASIL.map((b) => (
                <tr key={b.nivel} className="hover:bg-sub-alt/20">
                  <td className="py-2.5 pr-4 font-semibold text-foreground">{b.nivel}</td>
                  <td className="py-2.5 pr-4 font-mono text-accent">{b.tpm}</td>
                  <td className="py-2.5 pr-4 font-mono text-foreground/80">{b.ppm}</td>
                  <td className="py-2.5 text-foreground/80">{b.contexto}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs text-sub">
          Para ver estatísticas detalhadas de idade e ocupação, consulte o guia de{" "}
          <Link href="/guides/average-typing-speed">velocidade média de digitação</Link>.
        </p>

        <h2 id="concursos-publicos">Digitação para concursos públicos (Tribunais e Cartórios)</h2>
        <p>
          Cargos como Escrevente Técnico do Tribunal de Justiça de São Paulo (TJSP), oficiais de justiça e técnicos de tribunais
          regionais realizam provas práticas de digitação eliminatórias:
        </p>
        <ul>
          <li>
            <strong>Critério de Eliminação:</strong> Erros graves em palavras longas ou perda de linha desclassificam na hora.
            Treinar a leitura uma ou duas palavras à frente na tela evita pular termos no calor da prova.
          </li>
          <li>
            <strong>Resistência Muscular:</strong> Provas de 5 a 10 minutos causam fadiga rápida em dedos despreparados. Faça pausas e
            exercícios específicos do nosso{" "}
            <Link href="/guides/typing-stretches-and-hand-warmups">guia de alongamento para digitadores</Link>.
          </li>
        </ul>

        <h2 id="textos-treino">Textos de treino recomendados por nível</h2>
        <p>
          Pratique a leitura e a digitação contínua destes parágrafos adaptados ao vocabulário do dia a dia e dos exames:
        </p>
        <div className="flex flex-col gap-3.5">
          {EXEMPLOS_PT.map((ex) => (
            <div key={ex.nivel} className="theme-transition rounded-xl border border-border bg-sub-alt/20 p-4">
              <p className="font-mono text-xs font-semibold uppercase tracking-wider text-accent">
                {ex.nivel}
              </p>
              <p className="mt-1 text-xs text-sub/80">{ex.nota}</p>
              <p className="mt-2 text-sm leading-relaxed text-foreground font-mono bg-bg/50 p-2.5 rounded-lg border border-border/40">
                {ex.texto}
              </p>
            </div>
          ))}
        </div>

        <h2 id="treinamento-diario">Como treinar diariamente no HeroTyping</h2>
        <p>
          Para subir de 30 para 70 PPM em poucas semanas com treino inteligente:
        </p>
        <ol className="list-decimal space-y-2 pl-5 text-foreground/90">
          <li>
            <strong>Teste sua velocidade agora:</strong> Inicie o{" "}
            <Link href="/pt-BR">teste de digitação em português (Brasil)</Link> e cronometre 60 segundos com palavras reais.
          </li>
          <li>
            <strong>Treine dedos e teclas fracas:</strong> Reforce a agilidade do mindinho direito na cedilha e acentos no{" "}
            <Link href="/practice/weak-keys">treino de teclas difíceis</Link>.
          </li>
          <li>
            <strong>Cole textos de editais:</strong> Cole parágrafos do edital do seu concurso no{" "}
            <Link href="/typing-test/custom-text">teste com texto próprio</Link>.
          </li>
          <li>
            <strong>Use o &lsquo;Caret Fantasma&rsquo;:</strong> Ative o cursor de ritmo (Ghost Caret) no{" "}
            <Link href="/guides/improve-typing-speed-with-ghost-caret">guia de cursor de ritmo</Link> para manter cadência fixa.
          </li>
        </ol>

        <FaqSection items={FAQ_ITEMS} />

        <p className="text-xs text-sub">Última atualização: {UPDATED}.</p>
      
        <SourceList
          sources={[
          {
                    "label": "Associação Brasileira de Normas Técnicas (ABNT NBR 10346:1991) — \"Disposição do teclado alfanumérico para processamento de dados (ABNT2)\"",
                    "href": "https://www.abnt.org.br/"
          },
          {
                    "label": "Dhakal, Feit, Kristensson & Oulasvirta — \"Observations on Typing from 136 Million Keystrokes on a Website\" (Aalto University / CHI 2018)",
                    "href": "https://userinterfaces.aalto.fi/136Mkeystrokes/"
          }
]}
        />

      </GuideLayout>
    </>
  );
}
