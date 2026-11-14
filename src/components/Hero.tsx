/**
 * Hero section — MARPILAH. One screen, one product: the three waste bins.
 * Copy names the thing plainly; buttons use verb + object; max two actions.
 */
export default function Hero() {
  return (
    <section className="hero" id="mulai" aria-labelledby="hero-title">
      <div className="hero-wrap">
        <div className="hero-copy">
          <h1 id="hero-title">
            Memilah itu gampang kalau tahu <em>warnanya</em>.
          </h1>
          <p>
            Tiga tong, tiga tugas. MARPILAH memandu kamu mengenali tong hijau,
            biru, dan abu-abu, lalu langsung mencobanya lewat animasi
            interaktif — tanpa perlu menghafal aturan yang rumit.
          </p>
          <div className="hero-cta">
            <a className="start" href="#pilah-scene">
              Coba pilah sekarang
            </a>
            <a className="peek" href="#kenali">
              Kenali tongnya dulu
            </a>
          </div>
        </div>
        <div className="hero-bins">
          <div className="bin bin-green">
            <div className="bin-swatch"></div>
            <span className="bin-label">Hijau · organik</span>
          </div>
          <div className="bin bin-blue">
            <div className="bin-swatch"></div>
            <span className="bin-label">Biru · anorganik</span>
          </div>
          <div className="bin bin-gray">
            <div className="bin-swatch"></div>
            <span className="bin-label">Abu-abu · residu</span>
          </div>
        </div>
      </div>
    </section>
  );
}
