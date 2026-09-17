import { assetUrl } from "../../../infrastructure/assetUrl";
export default function Masthead({ title, subtitle, logo }: { title: string; subtitle: string; logo?: { src: string; alt: string } }) {
  return (
    <header className="masthead">
      {logo && <a className="logo" href="https://www.sum-project.eu" target="_blank" rel="noopener"><img src={assetUrl(logo.src)} alt={logo.alt} /></a>}
      <div className="title">
        <h1>{title}</h1>
        <div className="sub">{subtitle}</div>
      </div>
      <div className="tags">
        <span className="tag"><span className="full">Nuit européenne des chercheurs 2026</span><span className="short">Nuit des chercheurs 2026</span></span>
        <span className="tag ghost">INOCS · Inria</span>
      </div>
    </header>
  );
}
