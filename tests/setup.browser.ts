// Browser-mode test setup.
//
// vitest-browser-react auto-registers a cleanup() after each test, so we don't
// need to wire that here. The ported design-system stylesheet is imported here
// so computed-style fidelity assertions resolve against real CSS.
import "@/styles/timy.css";
