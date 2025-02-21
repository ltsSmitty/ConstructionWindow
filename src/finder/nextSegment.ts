import { debug } from "~/utilities/logger";
import { getTrackElements, TrackElementItem } from "~/finder/getTileElements";
import { Segment } from "~/track/segment";

/**
 * For a given segment, return whether or not a next segment exists and if so, what it is.
 */
export const doesSegmentHaveNextSegment = ({
	selectedSegment,
	tiAtSegment,
	buildDirection,
}: {
	selectedSegment: Segment | null;
	tiAtSegment: TrackIterator;
	buildDirection: "next" | "previous" | null;
}): null | "ghost" | "real" => {
	// create a copy of the TI to safely iterate through the track
	const thisTI = tiAtSegment;

	if (selectedSegment == null || thisTI.nextPosition == null) {
		debug(
			`${
				selectedSegment == null
					? "selectedSegment is null"
					: "tiAtSegment.nextPosition is null"
			}`
		);
		return null;
	}
	if (buildDirection == null) {
		debug(`buildDirection is null`);
		return null;
	}
	const followingPosition =
		buildDirection === "next" ? thisTI.nextPosition : thisTI.previousPosition;

	if (followingPosition == null) {
		debug(`followingPosition is null`);
		return null;
	}

	const { x, y, z, direction } = followingPosition; // location of next track element
	const trackELementsOnNextTile = getTrackElements({ x, y });

	if (trackELementsOnNextTile.length === 0) {
		debug(`No track elements on next tile`);
		return null;
	}

	// make sure the ride matches this ride
	const trackForThisRide = trackELementsOnNextTile.filter(
		(e) => e.element.ride === selectedSegment.ride
	);

	// hopefully this one happens most of the time, that there's only one track element on those coords.
	debug(
		`There are ${trackForThisRide.length} track elements for this ride on the ${direction} tile.`
	);
	if (trackForThisRide.length === 1) {
		const thisElementType = trackForThisRide[0].element.isGhost ? "ghost" : "real";
		debug(`It is a ${thisElementType} element.`);
		return thisElementType;
	}

	const nextTracksWhichMatchDirectionAndZ = trackForThisRide.filter((t) => {
		// t is a track element that already exists on the tile in question. it may has a different z and direction than the one we're trying to place
		const trackSegment = t.segment;
		const selectedSegmentBaseZ =
			context.getTrackSegment(Number(trackSegment?.trackType || 0))?.beginZ || 0;

		// todo this might be where a % might be needed.
		debug(
			`Existing track piece.baseZ + selectedSegmentBaseZ = ${
				t.element.baseZ
			} + ${selectedSegmentBaseZ} = ${t.element.baseZ + selectedSegmentBaseZ}`
		);
		debug(
			`Existing track piece baseZ - selectedSegmentBaseZ = ${
				t.element.baseZ
			} - ${selectedSegmentBaseZ} = ${t.element.baseZ - selectedSegmentBaseZ}`
		);
		debug(`Existing track piece baseZ = z: ${t.element.baseZ} ?= ${z}`);
		debug(`Non-adjusted trackSegment direction: ${t.element.direction} ?= ${direction}`, true);

		return (
			t.element.direction === direction &&
			(t.element.baseZ + selectedSegmentBaseZ === z ||
				t.element.baseZ - selectedSegmentBaseZ === z ||
				t.element.baseZ === z)
		);
	});

	let thisTrack: TrackElementItem;

	// if there are two segments for the same ride in this tile, make sure it's the proper one
	if (nextTracksWhichMatchDirectionAndZ.length === 0) {
		debug(
			`There is a track at the next coords, but it doesn't match the proper z range and direction, so returning that there is no next track.`
		);
		debug(
			`${trackForThisRide.map(
				(t) => ` baseZ: (${t.element.baseZ}, direction: ${t.element.direction})`
			)}`
		);

		return null;
	}

	if (trackForThisRide.length > 1) {
		debug(`There is more than one element at the next tile for this ride ${x},${y}`);
		const chosenTrack = trackForThisRide.filter((t) => t.element.baseZ === z);
		thisTrack = chosenTrack[0];
	} else {
		thisTrack = trackForThisRide[0];
	}

	if (!thisTrack?.element) {
		debug(
			`I must have filtered too well and there are no track elements for this ride at the next tile.`
		);
	}

	if (thisTrack.element.isGhost) return "ghost";
	return "real";
};
