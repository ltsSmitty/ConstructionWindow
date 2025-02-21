import { WidgetCreator, FlexiblePosition, listview, compute } from "openrct2-flexui";
import { buttonState, buildState, segmentState } from "~/stores";

const buttonPressListview = (): WidgetCreator<FlexiblePosition> => {
	// display stats for the selected segment
	return listview({
		height: 50,
		items: compute(
			buttonState.buttonPressCombination.curve,
			buttonState.buttonPressCombination.bank,
			buttonState.buttonPressCombination.pitch,
			buildState.direction,
			(curve, bank, pitch, direction) => {
				const initialBuildLocation = segmentState.getBuildLocation(direction);
				const locationString = initialBuildLocation
					? `${initialBuildLocation.x}, ${initialBuildLocation.y}, ${initialBuildLocation.z}; ${initialBuildLocation.direction}`
					: "No location";
				return [
					`Curve: ${curve ?? "none"}`,
					`Bank: ${bank ?? "none"}`,
					`Pitch: ${pitch ?? "none"}`,
					`Initial location: ${locationString}`,
				];
			}
		),
	});
};

export default buttonPressListview;
