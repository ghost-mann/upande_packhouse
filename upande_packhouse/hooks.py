app_name = "upande_packhouse"
app_title = "Upande Packhouse"
app_publisher = "Upande"
app_description = "Packhouse workflow dashboard (React + TypeScript SPA) for Upande."
app_email = "james@upande.com"
app_license = "mit"

# Website / SPA routing
# ---------------------
# The React dashboard is served by the `packhouse` www page. These rules let the
# canonical /packhouse-dashboard URL (and any client-side sub-routes) resolve to it.
website_route_rules = [
	{"from_route": "/packhouse-dashboard", "to_route": "packhouse"},
	{"from_route": "/order-summary", "to_route": "packhouse"},
	{"from_route": "/stock-visibility", "to_route": "packhouse"},
	{"from_route": "/cold-room", "to_route": "packhouse"},
	{"from_route": "/sales-allocation-planning", "to_route": "packhouse"},
	{"from_route": "/bucket-tracker", "to_route": "packhouse"},
	{"from_route": "/packhouse/<path:app_path>", "to_route": "packhouse"},
]

# Includes in <head>
# ------------------
# build assets are emitted into upande_packhouse/public/frontend by `yarn build`.
