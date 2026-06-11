/// <reference types="vite/client" />

declare global {
  interface Window {
    csrf_token?: string
    user?: string
    user_fullname?: string
    site_name?: string
    frappe_version?: string
  }
}

export {}
