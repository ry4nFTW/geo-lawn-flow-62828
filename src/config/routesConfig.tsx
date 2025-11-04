// src/config/routesConfig.tsx

import Dashboard from "@/pages/Dashboard";
import Customers from "@/pages/Customers";
import Jobs from "@/pages/Jobs";
import Reports from "@/pages/Reports";
import Settings from "@/pages/Settings";
import CustomerPortalPage from "@/pages/CustomerPortal";
import Portal from "@/pages/Portal";
import Auth from "@/pages/Auth";
import Index from "@/pages/Index";
import NotFound from "@/pages/NotFound";
import CompanyLandingPage from "@/pages/CompanyLandingPage";
import LawnmeLandingPage from "@/pages/LawnmeLandingPage";

// Each route defines: path, element, and allowed user roles
// Roles are flexible strings; your useUser() hook should return one (e.g. "manager" or "customer")

export const routesConfig = [
  {
    path: "/",
    element: <Index />,
    roles: ["guest"], // Public page
  },
  {
    path: "/company",
    element: <CompanyLandingPage />,
    roles: ["guest"], // Public Route
  },
  {
  path: "/lawnme",
  element: <LawnmeLandingPage />,
  roles: ["manager", "employee"],
  },
  {
    path: "/auth",
    element: <Auth />,
    roles: ["guest"], // Public login page
  },
  {
    path: "/dashboard",
    element: <Dashboard />,
    roles: ["manager", "customer"], // Both can see dashboard
  },
  {
    path: "/customers",
    element: <Customers />,
    roles: ["manager"], // Only managers can view this
  },
  {
    path: "/jobs",
    element: <Jobs />,
    roles: ["manager"], // Only managers can view this
  },
  {
    path: "/reports",
    element: <Reports />,
    roles: ["manager"], // Managers only
  },
  {
    path: "/settings",
    element: <Settings />,
    roles: ["manager"], // Managers only
  },
  {
    path: "/portal",
    element: <Portal />,
    roles: ["customer","guest"], // Customer-only view
  },
  {
    path: "/customer",
    element: <CustomerPortalPage />,
    roles: ["customer"], // Customer-only view
  },
  {
    path: "*",
    element: <NotFound />,
    roles: ["guest", "manager", "employee", "customer"], // Catch-all route for unknown pages
  },
];
//
//  routesConfig.tsx
//  
//
//  Created by Ryan Lewis on 11/3/25.
//

