/**
 * Public API of the service layer. UI code imports from here only.
 * Each module maps 1:1 to a future FastAPI router.
 */
export * as workspaceApi from "./workspace";
export * as contactsApi from "./contacts";
export * as conversationsApi from "./conversations";
export * as appointmentsApi from "./appointments";
export * as dashboardApi from "./dashboard";
export * as simulatorApi from "./simulator";
export * as templatesApi from "./templates";
export * as campaignsApi from "./campaigns";
export * as automationsApi from "./automations";
export * as aiApi from "./ai";
export * as integrationsApi from "./integrations";
export * as billingApi from "./billing";
export * as demoApi from "./demo";
export { subscribe } from "./client";
