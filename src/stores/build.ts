import { compute, store } from "openrct2-flexui";
import { TrackElementType, RideType } from "~/constants";
import { computeBuildLocation } from "~/track/computations/computeBuildLocation";
import { debug } from "~/utilities/logger";

/** Whether pointed forward (next), in the standard direction cars get launched, or backward (previous) */
export type BuildDirection = "next" | "previous";

export type TStore<T> = ReturnType<typeof store<T | undefined>>;

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
	/**
	 * The build location which the TI says a new track should be placed to build it properly. This store's value gets computed upon change and the new value is stored in a private computedBuildLocation store.
	 */
	initialBuildLocation: TStore<CoordsXYZD>;
	/**
	 * Location after considering building forward/backward, inverted, up vs down, etc.
	 * This may or may not be the same as the initialBuildLocation.
	 */
	computedBuildLocation: TStore<CoordsXYZD>;
	/**
	 * The finished build state is the build state holds either a finished build state or null (representing a non-complete build).
	 */
	finishedBuildState: TStore<FinishedBuildState>;
};

const defaultBuildState: BuildState = {
	direction: store("next"),
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
}: {
	direction: TStore<BuildDirection>;
	trackElementType: TStore<TrackElementType>;
	initialBuildLocation: TStore<CoordsXYZD>;
}) => {
	return compute(
		direction,
		trackElementType,
		initialBuildLocation,
		(direction, trackElementType, initialBuildLocation) => {
			if (direction == null || trackElementType == null || initialBuildLocation == null) {
				debug(
					`Not all required values are set:
					Direction: ${direction},
					Track element type: ${trackElementType},
					Initial build location: ${initialBuildLocation}`
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
	direction = defaultBuildState.direction;
	rideType = defaultBuildState.rideType;
	ride = defaultBuildState.ride;
	trackElementType = defaultBuildState.trackElementType;
	initialBuildLocation = store<CoordsXYZD>();
	computedBuildLocation = computedBuildLocation({
		direction: this.direction,
		trackElementType: this.trackElementType,
		initialBuildLocation: this.initialBuildLocation,
	});
	finishedBuildState = finishedBuildState(this);
}

export const buildState = new BuildStateObj();
