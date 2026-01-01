import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import "./styles.css";

const container =
  document.getElementById("carousel-root") ||
  document.getElementById("root");

if (container) {
  createRoot(container).render(<App />);
}