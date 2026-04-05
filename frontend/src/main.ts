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
