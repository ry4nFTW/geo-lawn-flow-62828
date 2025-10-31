import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// ❌ Remove BrowserRouter here — it's already inside App.tsx
createRoot(document.getElementById("root")!).render(<App />);
