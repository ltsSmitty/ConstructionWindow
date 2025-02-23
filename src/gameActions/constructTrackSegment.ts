import { StaticBuildModel, SuccessProps } from "~/models/BuildModel";
import { debug } from "~/utilities/logger";

export type ConstructionOptions = "real" | "ghost";
export type ActionType = keyof Pick<typeof context, "executeAction" | "queryAction">;

export const constructTrackSegment = ({
	rideId,
	rideType,
	trackElementType,
	location,
	constructionOption,
	actionType,
	onCompute,
}: NonNullableObject<StaticBuildModel> & {
	constructionOption: ConstructionOptions;
	actionType: ActionType;
	onCompute?: (v: SuccessProps) => void;
}) => {
	const constructArgs: TrackPlaceArgs = {
		...location,
		ride: rideId,
		trackType: trackElementType,
		rideType,
		brakeSpeed: 0,
		colour: 0,
		seatRotation: 0,
		trackPlaceFlags: 0,
		isFromTrackDesign: false,
	};

	context[actionType]("trackplace", constructArgs, (v) => {
		if (v.error != null) {
			debug(`${actionType}: Failed to construct track segment: ${v.error}`);
			onCompute ? onCompute({ success: false, reason: v.errorMessage ?? "" }) : null;
		}
		debug(`${actionType}: Successfully constructed track segment.`);
		onCompute ? onCompute({ success: true, reason: undefined }) : null;
	});
};
