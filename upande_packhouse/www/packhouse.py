import frappe
from frappe import _
from frappe.utils import cint, get_system_timezone

no_cache = 1


def get_context(context):
	"""Serve the Packhouse React SPA, injecting the boot payload the frontend needs."""
	if frappe.session.user == "Guest":
		frappe.throw(_("You need to be logged in to access the Packhouse dashboard."), frappe.PermissionError)

	context.no_cache = 1
	context.boot = get_boot()
	return context


def get_boot():
	return frappe._dict(
		{
			"frappe_version": frappe.__version__,
			"site_name": frappe.local.site,
			"csrf_token": frappe.sessions.get_csrf_token(),
			"user": frappe.session.user,
			"user_fullname": frappe.utils.get_fullname(frappe.session.user),
			"setup_complete": cint(frappe.get_system_settings("setup_complete")),
			"timezone": {
				"system": get_system_timezone(),
				"user": frappe.db.get_value("User", frappe.session.user, "time_zone")
				or get_system_timezone(),
			},
		}
	)
