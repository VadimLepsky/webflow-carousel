import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import "./styles.css";

function mount() {
  const container = document.getElementById("carousel-root");
  if (!container) return;

  createRoot(container).render(<App />);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", mount);
} else {
  mount();
}