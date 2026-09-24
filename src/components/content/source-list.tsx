interface Source {
  label: string;
  href: string;
}

/** External sources cited for factual claims -- kept short and relevant, not a citation dump. rel="noopener" only: these are legitimate, non-sponsored educational/research sources, not user content. */
export function SourceList({ sources }: { sources: Source[] }) {
  return (
    <>
      <h2 id="sources">Sources &amp; references</h2>
      <ul>
        {sources.map((source) => (
          <li key={source.href}>
            <a href={source.href} target="_blank" rel="noopener">
              {source.label}
            </a>
          </li>
        ))}
      </ul>
    </>
  );
}
