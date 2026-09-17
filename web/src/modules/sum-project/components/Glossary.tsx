// Lexique : les mots du parcours, définis en une phrase. Trié alphabétiquement (locale fr).
// Utilisé deux fois : dans « Pour l'animateur »/« Lexique » du conseil, et en modale depuis l'accueil.
type Props = { items: { term: string; definition: string }[] };

export default function Glossary({ items }: Props) {
  const sorted = [...items].sort((a, b) => a.term.localeCompare(b.term, "fr"));
  return (
    <div>
      <p className="gintro">Les mots que vous entendrez ce soir, en une phrase.</p>
      <dl className="glossary">
        {sorted.map((it, i) => (
          <div className="g" key={i}>
            <dt>{it.term}</dt>
            {it.definition && it.definition.trim() ? (
              <dd>{it.definition}</dd>
            ) : (
              <dd className="empty">Définition à compléter</dd>
            )}
          </div>
        ))}
      </dl>
    </div>
  );
}
