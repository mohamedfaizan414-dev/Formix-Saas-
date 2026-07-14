import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Global fetch interceptor to dynamically prepend VITE_API_URL and support cross-origin sessions
const originalFetch = window.fetch;
window.fetch = async function (resource, options) {
  let url = resource;
  let requestOptions = options;
  const apiBase = import.meta.env.VITE_API_URL || "";

  if (typeof url === "string" && url.startsWith("/api/")) {
    const cleanBase = apiBase.endsWith("/") ? apiBase.slice(0, -1) : apiBase;
    url = cleanBase + url;
  } else if (url && typeof url === "object" && typeof url.url === "string" && url.url.startsWith("/api/")) {
    const cleanBase = apiBase.endsWith("/") ? apiBase.slice(0, -1) : apiBase;
    url = cleanBase + url.url;
  }

  if (apiBase) {
    if (!requestOptions) {
      requestOptions = { credentials: "include" };
    } else {
      requestOptions.credentials = "include";
    }
  }
  return originalFetch(url, requestOptions);
};

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
