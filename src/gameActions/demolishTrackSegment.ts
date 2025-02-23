import { ConstructionOptions, ActionType } from "~/gameActions/constructTrackSegment";
import { StaticBuildModel, SuccessProps } from "~/models/BuildModel";
import { debug } from "~/utilities/logger";

// TODO it might be worth it to make a "query then build" function to validate it in the step in case something has changed before building

export const demolishTrackSegment = ({
	rideId,
	rideType,
	trackElementType,
	location,
	constructionOption,
	actionType,
	onCompute,
}: NonNullableObject<StaticBuildModel> & {
	constructionOption: ConstructionOptions | "both";
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

	context[actionType]("trackremove", constructArgs, (v) => {
		if (v.error != null) {
			debug(`${actionType}: Failed to construct track segment: ${v.error}`);
			onCompute ? onCompute({ success: false, reason: v.errorMessage ?? "" }) : null;
		}
		debug(`${actionType}: Successfully constructed track segment.`);
		onCompute ? onCompute({ success: true, reason: undefined }) : null;
	});
};
