import { assetUrl } from "../../../infrastructure/assetUrl";
export default function Masthead({ title, subtitle, logo, how }: { title: string; subtitle: string; logo?: { src: string; alt: string }; how?: string }) {
  return (
    <header className="masthead">
      {logo && <a className="logo" href="https://www.sum-project.eu" target="_blank" rel="noopener"><img src={assetUrl(logo.src)} alt={logo.alt} /></a>}
      <div className="title">
        <div className="tags"><span className="tag">SUM · Living Labs</span><span className="tag ghost">INOCS · Inria</span><span className="tag ghost">Nuit européenne des chercheurs 2026</span></div>
        <h1>{title}</h1>
        <div className="sub">{subtitle}</div>
      </div>
      {how && <div className="how"><b>Vous êtes maire</b> {how.replace(/ ([?!:;])/g, "\u00a0$1")}</div>}
    </header>
  );
}
