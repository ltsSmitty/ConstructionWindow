const pickerToolId = "ti-pick-xy";

/**
 * Starts a tool that allows the user to click on a track segment to select it.
 */
export function toggleXYPicker(
	isPressed: boolean,
	onPick: (coords: CoordsXY) => void,
	onCancel: () => void
): void {
	if (isPressed) {
		ui.activateTool({
			id: pickerToolId,
			cursor: "cross_hair",
			onDown: (args) => {
				// The picker will choose coords
				const coords = args.mapCoords;
				if (coords) {
					onPick(coords);
					ui.tool?.cancel();
				}
			},
			onFinish: onCancel,
		});
	} else {
		const tool = ui.tool;
		if (tool && tool.id === pickerToolId) {
			tool.cancel();
		}
	}
}
