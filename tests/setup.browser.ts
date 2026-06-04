// Browser-mode test setup.
//
// vitest-browser-react auto-registers a cleanup() after each test, so we don't
// need to wire that here. In Phase 1 the ported design-system stylesheet is
// imported here (`import "@/styles/timy.css"`) so computed-style fidelity
// assertions resolve against real CSS.
export {};
