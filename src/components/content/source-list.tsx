export interface Source {
  label?: string;
  href?: string;
  title?: string;
  author?: string;
  url?: string;
}

/** External sources cited for factual claims -- kept short and relevant, not a citation dump. rel="noopener" only: these are legitimate, non-sponsored educational/research sources, not user content. */
export function SourceList({ sources }: { sources: Source[] }) {
  return (
    <>
      <h2 id="sources">Sources &amp; references</h2>
      <ul>
        {sources.map((source, index) => {
          const href = source.href ?? source.url ?? "#";
          const label =
            source.label ??
            (source.title
              ? `${source.title}${source.author ? ` — ${source.author}` : ""}`
              : href);

          return (
            <li key={href !== "#" ? href : index}>
              <a href={href} target="_blank" rel="noopener">
                {label}
              </a>
            </li>
          );
        })}
      </ul>
    </>
  );
}
