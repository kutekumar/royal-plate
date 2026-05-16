import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "leaflet/dist/leaflet.css";
import "./styles/brand-filters.css";
import { registerServiceWorker, setupPWAPrompt } from "./utils/pwa";

registerServiceWorker();
setupPWAPrompt();

const root = document.getElementById("root")!;

if (root.hasChildNodes()) {
  createRoot(root);
} else {
  createRoot(root).render(<App />);
}
