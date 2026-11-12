import { useEffect, useState } from "react";

const SECTIONS = ["mulai", "kenali", "pilah-scene"] as const;

const LINK_LABELS: Record<(typeof SECTIONS)[number], string> = {
  mulai: "Mulai",
  kenali: "Kenali Tong",
  "pilah-scene": "Coba Pilah",
};

/**
 * Fixed top navigation. Mirrors the legacy behavior: the scrolled
 * background appears after 24 pixels, and the active link is the last
 * section whose top is at or above 45% of the viewport height.
 */
export default function SiteNav() {
  const [scrolled, setScrolled] = useState(false);
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    let queued = false;
    const update = () => {
      setScrolled(scrollY > 24);
      let current: string | null = null;
      for (const id of SECTIONS) {
        const section = document.getElementById(id);
        if (section && section.getBoundingClientRect().top <= innerHeight * 0.45)
          current = id;
      }
      setActive(current);
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

  return (
    <nav className={`site-nav${scrolled ? " scrolled" : ""}`} aria-label="Menu utama">
      <a className="brand" href="#mulai">
        MARPILAH<span className="brand-dot">.</span>
      </a>
      <div className="links">
        {SECTIONS.map((id) => (
          <a
            key={id}
            className={`link${active === id ? " on" : ""}`}
            href={`#${id}`}
            data-section={id}
          >
            {LINK_LABELS[id]}
          </a>
        ))}
      </div>
    </nav>
  );
}
