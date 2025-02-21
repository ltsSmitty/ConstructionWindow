import { WidgetCreator, FlexiblePosition, listview, compute } from "openrct2-flexui";
import { TrackElementType } from "~/constants";
import { buildState, segmentState } from "~/stores";

const selectedSegmentListview = (): WidgetCreator<FlexiblePosition> => {
	const { selectedSegment, selectedIndex, isCompleteCircuit } = segmentState;
	const { direction } = buildState;

	return listview({
		height: 80,
		items: compute(
			selectedSegment,
			selectedIndex,
			isCompleteCircuit,
			direction,
			(segment, index, circuit, direction) => {
				const trackElementTypeString = segment
					? TrackElementType[segment.trackType]
					: "none";
				const locationString = segment?.location
					? `${segment.location.x}, ${segment.location.y}, ${segment.location.z}; ${segment.location.direction}`
					: "No location";

				return [
					`Ride: ${segment?.ride ?? "none"}`,
					`Ride type: ${segment?.rideType ?? "none"}`,
					`Track element type:  ${trackElementTypeString}`,
					`Location: ${locationString}`,
					`Direction ${direction ?? "none"}`,
					`Selected index: ${index ?? "none"}`,
					// eslint-disable-next-line @typescript-eslint/restrict-template-expressions
					`Complete circuit: ${circuit ?? "none"}`,
				];
			}
		),
	});
};

export default selectedSegmentListview;
