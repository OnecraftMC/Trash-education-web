/**
 * The hero section, with the current copy, CTAs, and category facts
 * unchanged from the legacy page.
 */
export default function Hero() {
  return (
    <section className="hero" id="mulai" aria-labelledby="hero-title">
      <h1 id="hero-title">
        Memilah itu gampang kalau tahu <em>warnanya</em>.
      </h1>
      <p>
        Tiga tong, tiga tugas. MARPILAH memandu kamu mengenali tong hijau,
        biru, dan abu-abu lewat penjelasan singkat, lalu langsung
        mencobanya lewat animasi interaktif — tanpa perlu menghafal
        aturan yang rumit.
      </p>
      <div className="hero-cta">
        <a className="start" href="#pilah-scene">
          Coba pilah sekarang
        </a>
        <a className="peek" href="#kenali">
          Kenali tongnya dulu
        </a>
      </div>
      <div className="hero-facts">
        <b>
          <i style={{ background: "#3e9b4f" }}></i>Hijau <span>· organik</span>
        </b>
        <b>
          <i style={{ background: "#2f6fe0" }}></i>Biru <span>· anorganik</span>
        </b>
        <b>
          <i style={{ background: "#8b949c" }}></i>Abu-abu{" "}
          <span>· residu</span>
        </b>
      </div>
    </section>
  );
}
