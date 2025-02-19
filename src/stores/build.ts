import { arrayStore, compute, store } from "openrct2-flexui";
import { TrackElementType, RideType } from "~/constants";
import { computeBuildLocation } from "~/track/computations/computeBuildLocation";
import { debug } from "~/utilities/logger";

/** Whether pointed forward (next), in the standard direction cars get launched, or backward (previous) */
export type BuildDirection = "next" | "previous";

export type TStore<T> = ReturnType<typeof store<T | undefined>>;
export type TArrayStore<T> = ReturnType<typeof arrayStore<T[]>>;

type BuildState = {
	trackElementType: TStore<TrackElementType>;
	ride: TStore<number>;
	rideType: TStore<RideType>;
	direction: TStore<BuildDirection>;
};

type FinishedBuildState = {
	rideType: RideType;
	ride: number;
	trackElementType: TrackElementType;
	computedBuildLocation: CoordsXYZD;
};

type BuildStateStore = BuildState & {
	initialBuildLocation: TStore<CoordsXYZD>;
	computedBuildLocation: TStore<CoordsXYZD>;
	finishedBuildState: TStore<FinishedBuildState>;
};

const defaultBuildState: BuildState = {
	direction: store(),
	rideType: store(),
	ride: store(),
	trackElementType: store(),
};

const isFinishedBuildState = (buildState: BuildStateStore): boolean => {
	return (
		buildState.rideType.get() != null &&
		buildState.ride.get() != null &&
		buildState.trackElementType.get() != null &&
		buildState.computedBuildLocation.get() != null
	);
};

const computedBuildLocation = ({
	direction,
	trackElementType,
	initialBuildLocation,
}: BuildStateStore) => {
	return compute(
		direction,
		trackElementType,
		initialBuildLocation,
		(direction, trackElementType, initialBuildLocation) => {
			if (direction == null || trackElementType == null || initialBuildLocation == null) {
				debug(
					`Not all required values are set:
					${direction},
					${trackElementType},
					${initialBuildLocation}`
				);
				return;
			}

			const newBuildLocation = computeBuildLocation({
				initialLocation: initialBuildLocation,
				buildDirection: direction,
				trackElementType,
			});
			debug(`Computed new build location: ${newBuildLocation}`);
			return newBuildLocation;
		}
	);
};

const finishedBuildState = (buildState: BuildStateStore) => {
	const { computedBuildLocation, rideType, ride, trackElementType } = buildState;
	return compute(computedBuildLocation, () => {
		if (isFinishedBuildState(buildState)) {
			return {
				rideType: rideType.get()!,
				ride: ride.get()!,
				trackElementType: trackElementType.get()!,
				computedBuildLocation: computedBuildLocation.get()!,
			};
		}
		return undefined;
	});
};

class BuildStateObj implements BuildStateStore {
	trackElementType;
	ride;
	rideType;
	direction;

	constructor(props?: Partial<BuildState>) {
		// TODO check for serialized values before setting from default
		// and actually i'm overwriting, not setting the stores. should i be setting the stores?
		// since this is supposed to be a singleton i'm not sure it matters
		this.trackElementType = defaultBuildState.trackElementType;
		this.ride = props?.ride ?? defaultBuildState.ride;
		this.rideType = defaultBuildState.rideType;
		this.direction = defaultBuildState.direction;
	}
	initialBuildLocation = store<CoordsXYZD>();
	computedBuildLocation = computedBuildLocation(this);
	finishedBuildState = finishedBuildState(this);
}

export const buildState = new BuildStateObj();
