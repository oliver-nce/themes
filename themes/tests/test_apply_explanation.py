"""Unit tests for apply explanation text, fingerprints, and Apply acknowledgement gate."""
from __future__ import annotations

import html
import importlib
import sys
import unittest
from unittest.mock import MagicMock, patch

from themes.tests.test_backend_characterization import (
    FrappeThrow,
    TestThemeAppApplyGate,
    _reload_modules,
    fake_frappe,
)


def _wire_escape_html() -> None:
    utils_mod = sys.modules.setdefault("frappe.utils", MagicMock())
    utils_mod.escape_html = html.escape


def _load_apply_explanation():
    _wire_escape_html()
    name = "themes.utils.apply_explanation"
    if name in sys.modules:
        return importlib.reload(sys.modules[name])
    return importlib.import_module(name)


class ApplyExplanationFixture:
    def configure(
        self,
        frappe_mock,
        *,
        apply_explanation: str = "",
        apply_acknowledgements: str = "",
        app_path: str = "/apps/nce_events",
        developer_mode: bool = False,
    ) -> None:
        frappe_mock.get_app_path.return_value = app_path
        frappe_mock.conf = MagicMock()
        frappe_mock.conf.developer_mode = developer_mode
        _wire_escape_html()

        prior = getattr(frappe_mock.db.get_single_value, "side_effect", None)
        ack_store: dict[str, str] = {"apply_acknowledgements": apply_acknowledgements}

        def get_single_side_effect(doctype, fieldname):
            if doctype == "Theme Component Settings":
                if fieldname == "apply_explanation":
                    return apply_explanation
                if fieldname == "apply_acknowledgements":
                    return ack_store["apply_acknowledgements"]
            if callable(prior):
                return prior(doctype, fieldname)
            return ""

        frappe_mock.db.get_single_value.side_effect = get_single_side_effect

        def set_single_side_effect(doctype, fieldname, value):
            if doctype == "Theme Component Settings" and fieldname == "apply_acknowledgements":
                ack_store["apply_acknowledgements"] = value

        frappe_mock.db.set_single_value.side_effect = set_single_side_effect
        frappe_mock.db.commit = MagicMock()
        self._ack_store = ack_store

    @property
    def acks_raw(self) -> str:
        return self._ack_store.get("apply_acknowledgements", "")


class TestRenderExplanation(unittest.TestCase):
    def setUp(self) -> None:
        self.fx = ApplyExplanationFixture()

    def test_placeholders_replaced(self) -> None:
        with fake_frappe() as frappe_mock:
            self.fx.configure(frappe_mock, app_path="/apps/nce_events")
            mod = _load_apply_explanation()
            out = mod.render_explanation("nce_events")
        self.assertIn("/apps/nce_events/public/nce-themes/", out["html"])
        self.assertIn("nce_events", out["html"])
        self.assertNotIn("{app}", out["html"])
        self.assertNotIn("{path}", out["html"])

    def test_developer_mode_warning(self) -> None:
        with fake_frappe() as frappe_mock:
            self.fx.configure(frappe_mock, developer_mode=True)
            mod = _load_apply_explanation()
            out = mod.render_explanation("nce_events")
        self.assertTrue(out["developer_mode"])
        self.assertIn("Commit the current state", out["html"])

    def test_non_developer_mode_warning(self) -> None:
        with fake_frappe() as frappe_mock:
            self.fx.configure(frappe_mock, developer_mode=False)
            mod = _load_apply_explanation()
            out = mod.render_explanation("nce_events")
        self.assertFalse(out["developer_mode"])
        self.assertIn("not in developer mode", out["html"])
        self.assertIn("nce_events", out["html"])

    def test_fingerprint_stable_across_apps(self) -> None:
        with fake_frappe() as frappe_mock:
            self.fx.configure(frappe_mock)
            def paths(app: str) -> str:
                return f"/apps/{app}"

            frappe_mock.get_app_path.side_effect = paths
            mod = _load_apply_explanation()
            a = mod.render_explanation("nce_events")["fingerprint"]
            b = mod.render_explanation("custom_app")["fingerprint"]
        self.assertEqual(a, b)

    def test_fingerprint_changes_when_text_changes(self) -> None:
        with fake_frappe() as frappe_mock:
            self.fx.configure(frappe_mock, apply_explanation="<p>Custom {app} at {path}</p>")
            mod = _load_apply_explanation()
            custom_fp = mod.render_explanation("nce_events")["fingerprint"]
            default_fp = mod._fingerprint(mod.DEFAULT_EXPLANATION)
        self.assertNotEqual(custom_fp, default_fp)


class TestAcknowledgementHelpers(unittest.TestCase):
    def setUp(self) -> None:
        self.fx = ApplyExplanationFixture()

    def test_write_and_read_ack(self) -> None:
        with fake_frappe() as frappe_mock:
            self.fx.configure(frappe_mock)
            mod = _load_apply_explanation()
            fp = mod.render_explanation("nce_events")["fingerprint"]
            mod.write_ack("nce_events", fp)
            acks = mod.read_acks()
        self.assertEqual(acks.get("nce_events"), fp)

    def test_is_acknowledged_invalidated_by_text_change(self) -> None:
        with fake_frappe() as frappe_mock:
            self.fx.configure(frappe_mock, apply_explanation="<p>Version one {app}</p>")
            mod = _load_apply_explanation()
            fp = mod.render_explanation("nce_events")["fingerprint"]
            mod.write_ack("nce_events", fp)
            self.assertTrue(mod.is_acknowledged("nce_events"))

            frappe_mock.db.get_single_value.side_effect = lambda dt, fn: (
                "<p>Version two {app}</p>" if fn == "apply_explanation" else self.fx.acks_raw
            )
            self.assertFalse(mod.is_acknowledged("nce_events"))


class TestApplyExplanationApi(TestThemeAppApplyGate):
    def setUp(self) -> None:
        self.fx = ApplyExplanationFixture()

    def test_ack_required_for_apply_on(self) -> None:
        with fake_frappe() as frappe_mock:
            frappe_mock.only_for = MagicMock()
            self._configure_theme_app_mocks(
                frappe_mock,
                app_theme_slugs_raw="nce_events=ocean",
            )
            self.fx.configure(frappe_mock)
            _load_apply_explanation()
            _reload_modules("themes.component_api")
            with patch(
                "themes.component_api._is_frappe_branded",
                side_effect=self._is_frappe_branded_stub,
            ), patch(
                "themes.utils.app_theme_files.apply_to_app",
            ) as apply_mock, patch(
                "themes.component_api.publish_component_css",
                return_value={"status": "ok"},
            ):
                from themes.component_api import set_theme_app_apply

                with self.assertRaises(FrappeThrow) as ctx:
                    set_theme_app_apply("nce_events", 1)
                apply_mock.assert_not_called()
            self.assertEqual(str(ctx.exception), "Read the explanation for nce_events first.")

    def test_acknowledge_rejects_stale_fingerprint(self) -> None:
        with fake_frappe() as frappe_mock:
            frappe_mock.only_for = MagicMock()
            self._configure_theme_app_mocks(frappe_mock)
            self.fx.configure(frappe_mock)
            _load_apply_explanation()
            _reload_modules("themes.component_api")
            with patch(
                "themes.component_api._is_frappe_branded",
                side_effect=self._is_frappe_branded_stub,
            ):
                from themes.component_api import acknowledge_apply_explanation

                with self.assertRaises(FrappeThrow) as ctx:
                    acknowledge_apply_explanation("nce_events", "deadbeefdeadbeef")
            self.assertEqual(str(ctx.exception), "The explanation has changed. Please read it again.")

    def test_acknowledge_then_apply_on(self) -> None:
        with fake_frappe() as frappe_mock:
            frappe_mock.only_for = MagicMock()
            self._configure_theme_app_mocks(
                frappe_mock,
                app_theme_slugs_raw="nce_events=ocean",
            )
            self.fx.configure(frappe_mock)
            _load_apply_explanation()
            _reload_modules("themes.component_api")
            with patch(
                "themes.component_api._is_frappe_branded",
                side_effect=self._is_frappe_branded_stub,
            ), patch(
                "themes.utils.app_theme_files.apply_to_app",
                return_value={"app": "nce_events", "slug": "ocean", "files": [], "hooks_changed": True},
            ) as apply_mock, patch(
                "themes.utils.app_theme_files.app_status",
                return_value="applied",
            ), patch(
                "themes.component_api.rescan_all",
                return_value={"status": "ok"},
            ), patch(
                "themes.component_api.publish_component_css",
                return_value={"status": "ok"},
            ):
                from themes.component_api import acknowledge_apply_explanation, set_theme_app_apply
                from themes.utils import apply_explanation

                fp = apply_explanation.render_explanation("nce_events")["fingerprint"]
                acknowledge_apply_explanation("nce_events", fp)
                set_theme_app_apply("nce_events", 1)
                apply_mock.assert_called_once_with("nce_events", "ocean")


if __name__ == "__main__":
    unittest.main()
