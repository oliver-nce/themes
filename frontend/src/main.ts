// Vue app entry that mounts the theme editor with Frappe UI, the router, and resources.
//
// code-index:begin
// {
//  "purpose": "Vue app entry that mounts the theme editor with Frappe UI, the router, and resources.",
//  "read_when": "When the standalone frontend fails to boot or Frappe UI plugins are missing.",
//  "gotchas": [],
//  "keywords": ["createApp", "frappe-ui", "router", "resourceFetcher", "pageMetaPlugin", "resourcesPlugin", "app entry"],
//  "format": 1
// }
// code-index:end

import { createApp } from "vue"
import {
	Button,
	frappeRequest,
	pageMetaPlugin,
	resourcesPlugin,
	setConfig,
} from "frappe-ui"

import App from "./App.vue"
import router from "./router"
import "./index.css"

const app = createApp(App)

setConfig("resourceFetcher", frappeRequest)

app.use(router)
app.use(resourcesPlugin)
app.use(pageMetaPlugin)

app.component("Button", Button)

app.mount("#app")
