import { assetUrl } from "../../../infrastructure/assetUrl";
export default function Masthead({ title, subtitle, logo }: { title: string; subtitle: string; logo?: { src: string; alt: string } }) {
  return (
    <header className="masthead">
      {logo && <a className="logo" href="https://www.sum-project.eu" target="_blank" rel="noopener"><img src={assetUrl(logo.src)} alt={logo.alt} /></a>}
      <div className="title">
        <div className="tags"><span className="tag">SUM · Living Labs</span><span className="tag ghost">INOCS · Inria</span><span className="tag ghost">Nuit européenne des chercheurs</span></div>
        <h1>{title}</h1>
        <div className="sub">{subtitle}</div>
      </div>
      <div className="how"><b>Comment jouer</b> Cliquez sur un arrêt : le vélo y roule et ses ressources s'ouvrent à gauche. Suivez le trajet ou sautez où vous voulez.</div>
    </header>
  );
}
