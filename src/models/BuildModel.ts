import { compute, store } from "openrct2-flexui";
import { RideType, TrackElementType } from "~/constants";
import { ConstructionOptions, constructTrackSegment } from "~/gameActions/constructTrackSegment";
import { demolishTrackSegment } from "~/gameActions/demolishTrackSegment";
import { TStore } from "~/stores";
import { debug } from "~/utilities/logger";

export type SuccessProps =
	| { success: true; reason: undefined }
	| { success: false; reason: string };

export type StaticBuildModel = {
	rideId: number | undefined;
	rideType: RideType | undefined;
	trackElementType: TrackElementType | undefined;
	location: CoordsXYZD | undefined;
};

interface BuildModelState {
	rideId: TStore<number>;
	rideType: TStore<RideType>;
	trackElementType: TStore<TrackElementType>;
	location: TStore<CoordsXYZD>;

	isBuildValid: TStore<SuccessProps>;
	isDemolishValid: TStore<SuccessProps>;
}

interface BuildModelActions {
	build: (options: ConstructionOptions) => void;
	demolish: (options?: ConstructionOptions | "both") => void;
}

interface BuildModel extends BuildModelState, BuildModelActions {}

class BuildModelObj implements BuildModel {
	rideId = store<number | undefined>();
	rideType = store<RideType | undefined>();
	trackElementType = store<TrackElementType | undefined>();
	location = store<CoordsXYZD | undefined>();

	isBuildValid = store<SuccessProps>();
	isDemolishValid = store<SuccessProps>();

	// subscribe to the rideId, rideType, trackElementType, and location stores
	// and call constructTrackSegment with the values from the stores
	constructor() {
		compute(
			this.rideId,
			this.rideType,
			this.trackElementType,
			this.location,
			(rideId, rideType, trackElementType, location) => {
				computeValid({
					action: "construct",
					rideId,
					rideType,
					trackElementType,
					location,
					onCompute: (v) => {
						this.isBuildValid.set(v);
					},
				});
				computeValid({
					action: "demolish",
					rideId,
					rideType,
					trackElementType,
					location,
					onCompute: (v) => {
						this.isBuildValid.set(v);
					},
				});
			}
		);
	}

	build(options: ConstructionOptions) {
		if (this.isBuildValid.get()?.success) {
			constructTrackSegment({
				rideId: this.rideId.get()!,
				rideType: this.rideType.get()!,
				trackElementType: this.trackElementType.get()!,
				location: this.location.get()!,
				constructionOption: options,
				actionType: "executeAction",
			});
		} else {
			debug(`Build is not valid: ${this.isBuildValid.get()?.reason}`);
		}
	}

	demolish(options?: ConstructionOptions | "both") {
		if (this.isDemolishValid.get()?.success) {
			demolishTrackSegment({
				rideId: this.rideId.get()!,
				rideType: this.rideType.get()!,
				trackElementType: this.trackElementType.get()!,
				location: this.location.get()!,
				constructionOption: options ?? "both",
				actionType: "executeAction",
			});
		} else {
			debug(`Demolish is not valid: ${this.isDemolishValid.get()?.reason}`);
		}
	}
}

const computeValid = ({
	rideId,
	rideType,
	trackElementType,
	location,
	onCompute,
	action,
}: StaticBuildModel & {
	onCompute: (v: SuccessProps) => void;
	action: "construct" | "demolish";
}): void => {
	if (rideId == null || rideType == null || trackElementType == null || location == null) {
		onCompute({
			success: false,
			reason: "Not all required values are set.",
		});
		return;
	}
	action === "construct"
		? constructTrackSegment({
				rideId,
				rideType,
				trackElementType,
				location,
				constructionOption: "ghost",
				actionType: "queryAction",
				onCompute,
		  })
		: demolishTrackSegment({
				rideId,
				rideType,
				trackElementType,
				location,
				constructionOption: "ghost",
				actionType: "queryAction",
				onCompute,
		  });
};

export const buildModel = new BuildModelObj();
