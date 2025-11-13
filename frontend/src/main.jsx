import React from "react"
import { createRoot } from "react-dom/client"
import App from "./App.jsx"
import UploadTool from "./UploadTool.jsx"
import "./index.css"

const path = window.location.pathname.replace(/\/*$/, "") || "/"
const Page = path === "/upload-tool" ? UploadTool : App

createRoot(document.getElementById("root")).render(<Page />)
