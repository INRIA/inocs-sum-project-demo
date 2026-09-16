import { useState } from "react";
import { assetUrl } from "../../../infrastructure/assetUrl";
import type { Img } from "../lib/types";

// Image(s) principale(s) d'un arrêt : la première en grand, les autres en vignettes cliquables.
export default function Gallery({ images }: { images: Img[] }) {
  const [i, setI] = useState(0);
  const cur = images[Math.min(i, images.length - 1)];
  return (
    <figure className="gallery">
      <div className="main">
        {cur.src
          ? <img src={assetUrl(cur.src)} alt={cur.alt || cur.caption} />
          : <div className="ph"><b>IMAGE À INSÉRER</b>{cur.alt}</div>}
      </div>
      {(cur.caption || cur.credit) && (
        <figcaption>{cur.caption}{cur.credit && <span className="credit"> — {cur.credit}</span>}</figcaption>
      )}
      {images.length > 1 && (
        <div className="thumbs" role="tablist" aria-label="Images">
          {images.map((im, k) => (
            <button key={k} type="button" role="tab" aria-selected={k === i} className={k === i ? "on" : ""} onClick={() => setI(k)} title={im.caption}>
              {im.src ? <img src={assetUrl(im.src)} alt="" /> : <span className="ph-s">{k + 1}</span>}
            </button>
          ))}
        </div>
      )}
    </figure>
  );
}
