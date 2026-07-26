import React from "react"
import { createRoot } from "react-dom/client"
import App from "./App.jsx"
import AdminApp from "./AdminApp.jsx"
import "./index.css"

createRoot(document.getElementById("root")).render(
  window.location.pathname === "/admin" || window.location.pathname === "/admin/" ? <AdminApp /> : <App />
)
