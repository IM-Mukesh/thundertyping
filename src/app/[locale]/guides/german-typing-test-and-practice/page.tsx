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
  title: "Tipptest & 10-Finger-System Online",
  description:
    "Tipptest auf Deutsch online: Zehnfingersystem lernen, QWERTZ-Tastatur mit Umlauten (ä, ö, ü, ß), Anschläge pro Minute (APM) und DIN 2137 Prüfungsstandards.",
  path: "/guides/german-typing-test-and-practice",
});

const PUBLISHED = "2026-10-13";
const UPDATED = "2026-10-13";

const BEISPIELE_DE = [
  {
    stufe: "Grundstufe (ca. 100–150 Anschläge / 20–30 WPM)",
    hinweis: "Häufige Wörter, einfache Satzstrukturen, kaum Sonderzeichen.",
    text: "Die Sonne schien hell über dem grünen Wald. Wir gingen langsam den kleinen Weg entlang und freuten uns über den ruhigen Tag.",
  },
  {
    stufe: "Mittelstufe (ca. 200–280 Anschläge / 40–55 WPM)",
    hinweis: "Umlaute (ä, ö, ü), Kommasetzung, zusammengesetzte Substantive.",
    text: "Obwohl die Besprechung am Vormittag länger dauerte als geplant, konnten alle wichtigen Punkte für das nächste Quartal zügig und einvernehmlich beschlossen werden.",
  },
  {
    stufe: "Oberstufe & IHK-Prüfungsniveau (ab 300+ Anschläge / 60–85+ WPM)",
    hinweis: "Zahlen, Eszett (ß), Semikolons, Großschreibung und Fachwortschatz.",
    text: "In kaufmännischen Abschlussprüfungen (z. B. nach IHK-Leitfäden für Kaufleute für Büromanagement) wird auf standardisierten DIN-2137-Tastaturen eine Geschwindigkeit von mindestens 200 bis 250 Anschlägen pro Minute bei maximal 0,5 % Fehlerquote empfohlen, um die praktische Arbeit sicher zu bestehen.",
  },
];

const BENCHMARKS_DE = [
  { stufe: "Tippanfänger / Zwei-Finger-Sucher", apm: "80–140 APM", wpm: "16–28 WPM", kontext: "Personen, die noch auf die Tasten schauen oder das 10-Finger-System erlernen." },
  { stufe: "Durchschnittlicher Computernutzer", apm: "150–220 APM", wpm: "30–44 WPM", kontext: "Solide Geschwindigkeit für Alltags-E-Mails, Chats und Recherchen." },
  { stufe: "Berufliche Grundanforderung (Büro / IHK)", apm: "230–280 APM", wpm: "46–56 WPM", kontext: "Typische Richtwerte für kaufmännische Berufe (IHK / Berufsausbildung) auf genormten DIN-2137-Tastaturen." },
  { stufe: "Geübte Schnellschreiber", apm: "300–400 APM", wpm: "60–80 WPM", kontext: "Rechtsanwaltsfachangestellte, Redakteure, Programmierer und Vielschreiber." },
  { stufe: "Profi / Wettbewerbsniveau", apm: "450–600+ APM", wpm: "90–120+ WPM", kontext: "Deutsche Meisterschaften im Tastschreiben, Parlamentsstenografen." },
];

const FAQ_ITEMS = [
  {
    question: "Was ist der Unterschied zwischen Anschlägen pro Minute (APM) und Wörtern pro Minute (WPM)?",
    answer:
      "Im deutschsprachigen Raum wird die Tippgeschwindigkeit traditionell in 'Anschlägen pro Minute' (APM) gemessen, während die Norm DIN 2137 die ergonomische Tastaturbelegung regelt. Jeder Tastendruck (Buchstabe, Leerzeichen, Umschalttaste oder Satzzeichen) zählt als ein Anschlag. International und bei modernen Online-Tests wie HeroTyping wird oft in 'Words per Minute' (WPM) gerechnet. Die Faustformel zur Umrechnung lautet: 5 Anschläge entsprechen 1 Wort (APM / 5 = WPM).",
    plainAnswer:
      "5 Anschläge (APM) entsprechen genau 1 Wort pro Minute (WPM). 250 APM sind somit 50 WPM.",
  },
  {
    question: "Wie lerne ich das Zehnfingersystem auf der QWERTZ-Tastatur am effektivsten?",
    answer:
      "Der wichtigste Schritt ist das konsequente Blindschreiben: Schauen Sie unter keinen Umständen auf die Hände, sondern nur auf den Bildschirm. Platzieren Sie Ihre Zeigefinger auf den fühlbaren Erhebungen der Tasten F und J (Grundstellung: ASDF für links, JKLÖ für rechts). Trainieren Sie zunächst nicht auf Tempo, sondern auf 98 % Genauigkeit. Das Gehirn automatisiert die Fingerbewegungen im Schlaf; 15 Minuten tägliche Übung genügen völlig.",
    plainAnswer:
      "Legen Sie die Finger auf die Grundstellung (ASDF JKLÖ), schauen Sie ausschließlich auf den Bildschirm und priorisieren Sie Genauigkeit vor Tempo.",
  },
  {
    question: "Warum vertauschen viele Anfänger Z und Y auf deutschen Tastaturen?",
    answer:
      "Auf der deutschen QWERTZ-Tastatur ist das Z oben in der Reihe neben dem T platziert, während das Y unten links liegt — genau umgekehrt wie beim englischen QWERTY-Layout. Da Z im Deutschen sehr häufig vorkommt (z. B. in 'Zeit', 'zwei', 'zu'), liegt es griffgünstig in der oberen Reihe für den linken Zeigefinger.",
    plainAnswer:
      "Im Deutschen ist das Z viel häufiger als das Y und liegt daher ergonomisch in der oberen Reihe für den linken Zeigefinger.",
  },
  {
    question: "Welche Anschlagszahl verlangt die IHK für Bürokaufleute?",
    answer:
      "Für kaufmännische Ausbildungsberufe (z. B. Kaufmann/Kauffrau für Büromanagement) fordert die IHK in der Regel mindestens 200 bis 250 Anschläge pro Minute in einem 10-Minuten-Abschreibtest, wobei eine Fehlerquote von unter 0,5 % eingehalten werden muss.",
    plainAnswer:
      "In der Regel werden mindestens 200 bis 250 Anschläge pro Minute bei maximal 0,5 % Fehlern gefordert.",
  },
];

export default function GermanTypingTestPage() {
  const schema = buildArticleSchema({
    headline: "Tipptest & Zehnfingersystem: Tippgeschwindigkeit Online Üben (QWERTZ)",
    description:
      "Umfassender Ratgeber zum Tastschreiben auf Deutsch: Zehnfingersystem auf der QWERTZ-Tastatur, Umlaute, DIN 2137 Standards und Anschläge pro Minute.",
    path: "/guides/german-typing-test-and-practice",
    datePublished: PUBLISHED,
    inLanguage: "de",
  });

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <GuideLayout
        lang="de"
        title="Tipptest & Zehnfingersystem (Deutsch)"
        subtitle="Erlernen Sie das Zehnfingersystem auf der QWERTZ-Tastatur: Anschläge pro Minute (APM) nach genormter Belegung (DIN 2137), fehlerfreie Umlaute (ä, ö, ü, ß) und gezielte Übungslektionen."
        breadcrumbItems={[
          { name: "Guides", path: "/guides" },
          { name: "Tipptest Deutsch (QWERTZ)", path: "/guides/german-typing-test-and-practice" },
        ]}
        toc={[
          { id: "was-misst-der-test", label: "Was misst ein Tipptest?" },
          { id: "qwertz-grundstellung", label: "QWERTZ & Grundstellung" },
          { id: "umlaute-und-esszett", label: "Umlaute (ä, ö, ü) und ß" },
          { id: "benchmarks-din", label: "Geschwindigkeits-Standards" },
          { id: "beispieltexte", label: "Übungstexte nach Stufen" },
          { id: "trainingsplan", label: "Systematischer Trainingsplan" },
        ]}
        hasFaq
      >
        <Callout label="Zusammenfassung">
          <p>
            Ein deutscher Tipptest misst Ihre Schreibgeschwindigkeit entweder in <strong>Anschlägen pro Minute (APM)</strong> oder in
            internationalen <strong>Wörtern pro Minute (WPM)</strong>. Das Beherrschen des 10-Finger-Systems auf der QWERTZ-Tastatur
            steigert Ihre Produktivität im Büro drastisch und entlastet Nacken und Hände durch ergonomisches Blindschreiben.
          </p>
        </Callout>

        <p>
          Das Zehnfingersystem (auch *Tastschreiben* oder *Blindschreiben* genannt) ist keine angeborene Begabung, sondern reine motorische
          Konditionierung. Wer ohne Hinsehen tippen kann, spart im Arbeitsalltag bis zu 40 Minuten reine Schreibzeit pro Tag ein und kann
          seine Gedanken ohne kognitiven Bruch direkt in Text verwandeln.
        </p>

        <h2 id="was-misst-der-test">Was misst ein deutscher Tipptest?</h2>
        <p>
          Auf {SITE_NAME} analysiert der Tipptrainer Ihre Tastaturleistung anhand dreier wissenschaftlicher Parameter:
        </p>
        <ul>
          <li>
            <strong>Anschläge pro Minute (APM):</strong> Die Gesamtzahl aller betätigten Tasten (inklusive Leerzeichen und Umschalter).
            Rechnen Sie APM durch 5, um das internationale WPM-Äquivalent zu erhalten. Berechnen Sie Ihre Werte interaktiv im{" "}
            <Link href="/guides/wpm-cpm-kph-calculator">WPM- und APM-Rechner</Link>.
          </li>
          <li>
            <strong>Fehlerquote / Genauigkeit (%):</strong> Gemäß deutscher Prüfungsnormen gilt: <em>Präzision schlägt Tempo</em>.
            Wer 300 Anschläge mit vielen Tippfehlern tippt, verliert durch ständiges Löschen mit der Rücktaste (Backspace) enorm viel Zeit.
          </li>
          <li>
            <strong>Rhythmus und Gleichmäßigkeit:</strong> Ein gleichmäßiger Anschlagfluss beugt Sehnenscheidenentzündungen vor und verhindert
            Stockungen bei schwierigen Buchstabenfolgen.
          </li>
        </ul>

        <h2 id="qwertz-grundstellung">Die QWERTZ-Tastatur und die Grundstellung</h2>
        <p>
          Im Gegensatz zum englischen QWERTY-Layout nutzt der deutschsprachige Raum (Deutschland, Österreich, Schweiz) die QWERTZ-Tastatur:
        </p>
        <ul>
          <li>
            <strong>Grundstellung (Home Row):</strong> Die Finger ruhen entspannt auf der mittleren Buchstabenreihe:
            Linke Hand auf <strong>A – S – D – F</strong>, rechte Hand auf <strong>J – K – L – Ö</strong>.
            Die Zeigefinger finden die Tastaturerhebungen auf <strong>F</strong> und <strong>J</strong> blind.
            Details finden Sie in unserer{" "}
            <Link href="/guides/touch-typing-finger-map">Finger-Platzierungs-Anleitung</Link>.
          </li>
          <li>
            <strong>Das vertauschte Z und Y:</strong> Das Z wird mit dem linken Zeigefinger nach oben gegriffen, während das seltenere
            Y mit dem rechten Zeigefinger nach unten links bedient wird.
          </li>
        </ul>

        <h2 id="umlaute-und-esszett">Die deutschen Umlaute (ä, ö, ü) und das Eszett (ß)</h2>
        <p>
          Eine Besonderheit der deutschen Sprache sind die Umlaute und das scharfe S, die feste Positionen auf der Tastatur besitzen:
        </p>
        <ul>
          <li>
            <strong>Ö:</strong> Liegt direkt auf der Grundstellung unter dem rechten kleinen Finger.
          </li>
          <li>
            <strong>Ä:</strong> Wird mit dem rechten kleinen Finger rechts neben dem Ö erreicht.
          </li>
          <li>
            <strong>Ü:</strong> Wird in der oberen Reihe mit dem rechten kleinen Finger neben dem P bedient.
          </li>
          <li>
            <strong>ß (Eszett):</strong> Befindet sich in der oberen Zahlenreihe rechts neben der Null und wird ebenfalls mit dem rechten
            kleinen Finger bedient.
          </li>
        </ul>
        <p>
          Da der rechte kleine Finger im Deutschen stark beansprucht wird, empfehlen wir regelmäßige Lockerungsübungen aus unserem{" "}
          <Link href="/guides/typing-stretches-and-hand-warmups">Leitfaden für Hand-Dehnübungen</Link>.
        </p>

        <h2 id="benchmarks-din">Geschwindigkeits-Benchmarks und Tastaturnormen (DIN 2137 & IHK)</h2>
        <p>
          Wie schnell tippen Menschen in Deutschland und Österreich im Vergleich? Hier ist die offizielle Einstufung:
        </p>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-border text-sub font-mono uppercase">
                <th className="py-2.5 pr-4">Leistungsstufe</th>
                <th className="py-2.5 pr-4">Anschläge (APM)</th>
                <th className="py-2.5 pr-4">Wörter (WPM)</th>
                <th className="py-2.5">Beruflicher Kontext</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {BENCHMARKS_DE.map((b) => (
                <tr key={b.stufe} className="hover:bg-sub-alt/20">
                  <td className="py-2.5 pr-4 font-semibold text-foreground">{b.stufe}</td>
                  <td className="py-2.5 pr-4 font-mono text-accent">{b.apm}</td>
                  <td className="py-2.5 pr-4 font-mono text-foreground/80">{b.wpm}</td>
                  <td className="py-2.5 text-foreground/80">{b.kontext}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs text-sub">
          Ausführliche Vergleichsdaten nach Altersgruppen finden Sie im Ratgeber zur{" "}
          <Link href="/guides/average-typing-speed">durchschnittlichen Tippgeschwindigkeit</Link>.
        </p>

        <h2 id="beispieltexte">Übungstexte nach Schwierigkeitsgrad</h2>
        <p>
          Testen Sie Ihr Leseverständnis und Ihren Anschlagfluss anhand dieser typischen deutschsprachigen Textpassagen:
        </p>
        <div className="flex flex-col gap-3.5">
          {BEISPIELE_DE.map((b) => (
            <div key={b.stufe} className="theme-transition rounded-xl border border-border bg-sub-alt/20 p-4">
              <p className="font-mono text-xs font-semibold uppercase tracking-wider text-accent">
                {b.stufe}
              </p>
              <p className="mt-1 text-xs text-sub/80">{b.hinweis}</p>
              <p className="mt-2 text-sm leading-relaxed text-foreground font-mono bg-bg/50 p-2.5 rounded-lg border border-border/40">
                {b.text}
              </p>
            </div>
          ))}
        </div>

        <h2 id="trainingsplan">Systematischer Trainingsplan für das Blindschreiben</h2>
        <p>
          Um innerhalb von 3 bis 4 Wochen die Schwelle von 250 Anschlägen pro Minute sicher zu überschreiten:
        </p>
        <ol className="list-decimal space-y-2 pl-5 text-foreground/90">
          <li>
            <strong>Starten Sie den deutschen Online-Test:</strong> Machen Sie einen 60-Sekunden-Test auf unserem{" "}
            <Link href="/de">Tipptest Deutsch</Link>, um Ihren Ausgangswert zu bestimmen.
          </li>
          <li>
            <strong>Wiederholen Sie Problembuchstaben:</strong> Nutzen Sie das{" "}
            <Link href="/practice/weak-keys">Schwachstellen-Training</Link>, um unsichere Tasten wie Z, Q, P oder Umlaute zu festigen.
          </li>
          <li>
            <strong>Üben Sie mit eigenen Fachtexten:</strong> Fügen Sie Berichte oder juristische Texte in den{" "}
            <Link href="/typing-test/custom-text">benutzerdefinierten Texttest</Link> ein.
          </li>
          <li>
            <strong>Achten Sie auf die Ergonomie:</strong> Sorgen Sie für eine aufrechte Sitzhaltung und lockere Handgelenke (siehe{" "}
            <Link href="/guides/proper-typing-posture-and-ergonomics">Ergonomie- und Haltungs-Ratgeber</Link>).
          </li>
        </ol>

        <FaqSection items={FAQ_ITEMS} />

        <p className="text-xs text-sub">Zuletzt aktualisiert: {UPDATED}.</p>
      
        <SourceList
          sources={[
          {
                    "label": "Deutsches Institut für Normung (DIN 2137-1:2018-12) — \"Keyboards for administrative and data processing text input\" (DIN Standards)",
                    "href": "https://www.din.de/"
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
