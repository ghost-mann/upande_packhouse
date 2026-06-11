# Upande Packhouse

Packhouse workflow dashboard for Upande, built as a React + TypeScript + Tailwind SPA served inside Frappe.

## Frontend dev

```bash
cd frontend
yarn install
yarn dev      # http://localhost:8080, proxies API to the Frappe site
yarn build    # builds into ../upande_packhouse/public/frontend and copies www/packhouse.html
```

The dashboard is served at `/packhouse-dashboard`.

## License

mit
