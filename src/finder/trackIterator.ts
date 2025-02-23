import { debug } from "~/utilities/logger";
import { getSpecificTrackElement } from "~/finder/trackElements";
import { Segment } from "~/track/segment";

export const getTIAtSegment = ({
	segment,
	ride,
	location,
}: {
	segment?: Segment | null;
	ride?: number;
	location?: CoordsXYZD;
}): TrackIterator | undefined => {
	let thisRide: number;
	let thisLocation: CoordsXYZD;
	// debug(`Getting Ti at segment. Segment is ${JSON.stringify(segment)} and ride is ${ride} and location is ${JSON.stringify(location)}`);

	if (segment) {
		// debug(`Getting TI at segment ${JSON.stringify(segment)}.`);
		thisRide = segment.ride;
		thisLocation = segment.location;
	} else if (ride && location) {
		thisRide = ride;
		thisLocation = location;
	} else {
		debug(
			`finder.getTIAtSegment: No segment or ride & location provided to getTIAtSegment. Returning null`
		);
		return;
	}

	// debug(`Getting specific track element.`);
	const thisSegmentIndex = getSpecificTrackElement(thisRide, thisLocation)?.index ?? null; // needed for iterator
	if (thisSegmentIndex == null) {
		debug(`There was an issue getting the specific track element to get next segment options.`);
		return;
	}
	const newTI = map.getTrackIterator({ x: thisLocation.x, y: thisLocation.y }, thisSegmentIndex); // set up TI

	if (newTI == null) {
		debug(`There was an issue creating the track iterator to get next segment options.`);
		return;
	}
	// debug(`New TI is created at position (${newTI.position.x}, ${newTI.position.y}, ${newTI.position.z}) dir ${newTI.position.direction}.`);
	return newTI;
};
