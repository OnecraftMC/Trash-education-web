import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./styles/base.css";
import "./styles/navigation.css";
import "./styles/hero.css";
import "./styles/education.css";
import "./styles/footer.css";
import "./styles/scene.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
