import { useEffect, useState } from "react";
import type { Instruction } from "../lib/types";

// Échafaudage pas-à-pas des tables animées : un seul rythme, une seule action à l'écran.
// L'étape en cours est ouverte, les étapes faites sont repliées sur une ligne, les suivantes sont verrouillées.
// L'avancement est gardé par appareil (sessionStorage) : on peut ouvrir une carte et revenir sans perdre le fil.
type Props = { stopId: string; steps: Instruction[]; rule?: string };
type Saved = { done: number };

const KEY = (id: string) => `sum-steps:${id}`;
const load = (id: string): Saved => {
  try { const raw = sessionStorage.getItem(KEY(id)); if (raw) { const s = JSON.parse(raw); if (typeof s?.done === "number") return { done: s.done }; } } catch {}
  return { done: 0 };
};
const save = (id: string, s: Saved) => { try { sessionStorage.setItem(KEY(id), JSON.stringify(s)); } catch {} };

// « Regarder la carte (2 min) » → titre « Regarder la carte » + pastille « 2 min » (pas de pastille sans minutage).
const TIME = /\s*\((\d+)\s*min\)\s*$/;
const parseTitle = (t?: string) => {
  const raw = (t || "").trim();
  const m = raw.match(TIME);
  return m ? { title: raw.replace(TIME, ""), time: `${m[1]} min` } : { title: raw, time: null as string | null };
};

export default function Stepper({ stopId, steps, rule }: Props) {
  const [done, setDone] = useState(0);
  const [ready, setReady] = useState(false);

  useEffect(() => { setDone(load(stopId).done); setReady(true); }, [stopId]);
  useEffect(() => { if (ready) save(stopId, { done }); }, [ready, stopId, done]);

  const n = steps.length;
  if (n === 0) return null;
  const at = Math.min(Math.max(done, 0), n);   // nombre d'étapes faites, borné
  const finished = at >= n;

  return (
    <section className="stepper" aria-label="Étapes de la table">
      <div className="prog">
        <div className="lbl">{finished ? `Les ${n} étapes sont faites ✓` : `Étape ${at + 1} sur ${n}`}</div>
        <div className="track" aria-hidden="true"><span style={{ width: `${(at / n) * 100}%` }} /></div>
        {at > 0 && <button type="button" className="ghost" onClick={() => setDone(0)}>Recommencer ↺</button>}
      </div>

      <ol>
        {steps.map((s, i) => {
          const state = i < at ? "done" : i === at ? "current" : "locked";
          const { title, time } = parseTitle(s.title);
          const label = title || `Étape ${i + 1}`;
          const text = s.text || "";
          const head = (
            <>
              <span className="disc" aria-hidden="true">{state === "done" ? "✓" : state === "current" ? i + 1 : "🔒"}</span>
              <span className="t">{label}</span>
              {time && <span className="chip blue time">{time}</span>}
            </>
          );
          return (
            <li key={s.step ?? i} className={`step ${state}`} aria-current={state === "current" ? "step" : undefined}>
              {state === "done" ? (
                <button type="button" className="head" onClick={() => setDone(i)} aria-label={`Revenir à l'étape ${i + 1} : ${label}`}>
                  {head}
                  <span className="sum">{text}</span>
                </button>
              ) : (
                <div className="head">{head}</div>
              )}
              {state === "current" && (
                <div className="body">
                  {text ? <p>{text}</p> : <p><i>À compléter</i></p>}
                  <button type="button" className="iconbtn primary next" onClick={() => setDone(i + 1)}>
                    {i === n - 1 ? "Terminé ✓" : "Étape suivante →"}
                  </button>
                </div>
              )}
            </li>
          );
        })}
      </ol>

      {finished && (
        <div className="reflect">
          <h4>Et vous, qu'avez-vous décidé ?</h4>
          {rule && <div className="notice">♥ {rule}</div>}
          <p className="hint">Dites-le en une phrase à l'animateur, il la notera pour le conseil municipal.</p>
        </div>
      )}
    </section>
  );
}
