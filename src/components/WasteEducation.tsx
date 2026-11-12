import { useEffect, useState } from "react";
import { wasteCategories } from "../data/wasteCategories";

const SWATCH_LABELS: Record<string, string> = {
  green: "Tong hijau",
  blue: "Tong biru",
  gray: "Tong abu-abu",
};

const DOT_LABELS: Record<string, string> = {
  organic: "Organik",
  inorganic: "Anorganik",
  residual: "Residu",
};

/**
 * Scroll-driven "Kenali tongnya" education section. Mirrors the legacy
 * behavior: the panel follows the clamped scroll progress over the
 * pin-flow element, the dots stay on up to the active step, and the
 * progress bar scales with the raw progress.
 */
export default function WasteEducation() {
  const [state, setState] = useState({ step: 0, progress: 0 });

  useEffect(() => {
    let queued = false;
    const update = () => {
      const flow = document.querySelector<HTMLElement>(".pin-flow");
      const viewport = innerHeight;
      const scrollable = flow ? flow.offsetHeight - viewport : 0;
      const progress =
        flow && scrollable > 0
          ? Math.min(
              1,
              Math.max(0, -flow.getBoundingClientRect().top / scrollable),
            )
          : 0;
      const step = Math.min(
        wasteCategories.length - 1,
        Math.floor(progress * wasteCategories.length),
      );
      setState({ step, progress });
    };
    const onScroll = () => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(() => {
        queued = false;
        update();
      });
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  const { step, progress } = state;

  return (
    <div className="pin-flow" id="kenali">
      <div className="pin-stage">
        <div className="pin-head">
          <h2>Kenali tongnya</h2>
          <span className="pin-count" aria-hidden="true">
            <span id="pin-now">{step + 1}</span>/{wasteCategories.length}
          </span>
        </div>
        <div className="pin-panels">
          {wasteCategories.map((category, index) => (
            <article
              key={category.id}
              className={`pin-panel${index === step ? " on" : ""}`}
              data-step={index + 1}
            >
              <div className="pin-swatch">
                <span>{SWATCH_LABELS[category.binColor]}</span>
              </div>
              <div className="pin-copy">
                <h3>{category.title}</h3>
                <p>{category.description}</p>
                <ul>
                  {category.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
                <p className="pin-tip">{category.tip}</p>
              </div>
            </article>
          ))}
        </div>
        <div className="pin-progress">
          <div className="pin-dots" aria-hidden="true">
            {wasteCategories.map((category, index) => (
              <span
                key={category.id}
                className={`pin-dot${index <= step ? " on" : ""}`}
              >
                <i></i>
                {DOT_LABELS[category.id]}
              </span>
            ))}
          </div>
          <div className="pin-bar">
            <div
              className="pin-bar-fill"
              style={{ transform: `scaleX(${progress})` }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
}
