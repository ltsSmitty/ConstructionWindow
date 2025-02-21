// @ts-ignore
import * as info from "./info.js";
import { trackIteratorWindow } from "~/ui/window.js";
import { initCustomSprites } from "~/ui/customImages/customButtonSprites";

export function startup() {
	// Write code here that should happen on startup of the plugin.
	initCustomSprites();

	const window = trackIteratorWindow();
	// Register a menu item under the map icon:
	if (typeof ui !== "undefined") {
		ui.registerMenuItem(info.name, () => window.open());
	}
}
