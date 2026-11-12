import SiteNav from "./components/SiteNav";
import Hero from "./components/Hero";
import WasteEducation from "./components/WasteEducation";
import InteractiveScene from "./components/InteractiveScene";
import CallToAction from "./components/CallToAction";
import SiteFooter from "./components/SiteFooter";

export default function App() {
  return (
    <>
      <SiteNav />
      <main>
        <Hero />
        <WasteEducation />
        <InteractiveScene />
        <CallToAction />
      </main>
      <SiteFooter />
    </>
  );
}
