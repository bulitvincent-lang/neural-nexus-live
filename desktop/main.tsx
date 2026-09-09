import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { OrbApp } from "@/components/orb-ui/OrbApp";
import "@/styles.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <OrbApp />
  </StrictMode>,
);
