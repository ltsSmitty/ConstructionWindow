import { ConstructionOptions, ActionType } from "~/gameActions/constructTrackSegment";
import { StaticBuildModel, SuccessProps } from "~/models/BuildModel";
import { debug } from "~/utilities/logger";

export const demolishTrackSegment = ({
	rideId,
	rideType,
	trackElementType,
	location,
	constructionOption,
	actionType,
	callback,
}: NonNullableObject<StaticBuildModel> & {
	constructionOption: ConstructionOptions | "both";
	actionType: ActionType;
	callback?: (v: SuccessProps) => void;
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
			callback ? callback({ success: false, reason: v.errorMessage ?? "" }) : null;
		}
		debug(`${actionType}: Successfully constructed track segment.`);
		callback ? callback({ success: true, reason: undefined }) : null;
	});
};
