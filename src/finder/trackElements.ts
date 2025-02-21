import { debug } from "~/utilities/logger";
import { TrackElementType } from "~/constants";
import { getTrackElements, TrackElementItem } from "~/finder/getTileElements";
import { Segment } from "~/track/segment";

/**
 * @summary Returns an array of relative coords of the track elements for the segment.
 * @description E.g. for a large left turn, it returns 7 relatively spaced coords (for the seven tiles it covers)) that go from (0,0) to (+/-64,+/-64) depending on how the segment is rotated.
 */
const getRelativeElementsAtCurrentTIPosition = (
	thisTI: TrackIterator
): TrackSegmentElement[] | null => {
	const segmentElements = thisTI.segment?.elements;
	return segmentElements ?? [];
};

/**
 * @summary Get all TrackElementItems for a given segment. Use to get all elements of a multi-element segment (e.g. LeftQuarterTurn3Tiles, LeftQuarterTurn5Tiles, etc.). Useful for painting each element of the segment.
 * @description E.g. for a large left turn, there are 7 elements  with relatively spaced coords (for the seven tiles it covers) that go from (0,0) to (+/-64,+/-64) depending on how the segment is rotated. Convert those coords to absolute positioning.
 *
 * @returns the TrackElementItems with their absolute position the element, e.g. (1248, 1984)
 */
export const getAllSegmentTrackElements = ({
	segment,
	thisTI,
}: {
	segment: Segment;
	thisTI: TrackIterator;
}): TrackElementItem[] => {
	if (segment == null) {
		return [];
	}

	const segmentElements = getRelativeElementsAtCurrentTIPosition(thisTI);

	if (!segmentElements) {
		debug(`Error: somehow this segment has no elements`);
		return [];
	}

	const coords = segment.location;
	const x1 = coords.x;
	const y1 = coords.y;
	const z1 = coords.z;
	const direction = coords.direction;

	// get the proper position based on the direction of the segment and the element
	const exactCoordsUnderSegment = segmentElements.map((segmentElement) => {
		switch (coords.direction) {
			case 0: {
				return {
					x: x1 + segmentElement.x,
					y: y1 + segmentElement.y,
					z: z1,
					direction,
				};
			}
			case 1: {
				return {
					x: x1 + segmentElement.y,
					y: y1 - segmentElement.x,
					z: z1,
					direction,
				};
			}
			case 2: {
				return {
					x: x1 - segmentElement.x,
					y: y1 - segmentElement.y,
					z: z1,
					direction,
				};
			}
			case 3: {
				return {
					x: x1 - segmentElement.y,
					y: y1 + segmentElement.x,
					z: z1,
					direction,
				};
			}
		}
	});

	const allTheseElements: TrackElementItem[] = [];
	exactCoordsUnderSegment.forEach((coords) => {
		const element = getSpecificTrackElement(segment.ride, { ...coords });
		if (element) {
			allTheseElements.push(element);
		}
	});

	return allTheseElements;
};

/**
 * Get the TrackElementItem for a segment.
 * If there are multiple elements at the given coords, it will return the 0th.
 */
export const getTrackElementFromSegment = (
	segment: Pick<Segment, "ride" | "location">
): TrackElementItem | undefined => {
	// get the segment's ride and coords
	const { ride, location } = segment;
	return getSpecificTrackElement(ride, location);
};

/**
 * Get the TrackElementItem for a specific ride and given XYZD.
 * If there are somehow multiple elements at the given coords, it will return the 0th.
 */
export const getSpecificTrackElement = (
	ride: number,
	coords: CoordsXYZD
): TrackElementItem | undefined => {
	const trackElementsOnTile = getTrackElements({ x: coords.x, y: coords.y });
	const trackForThisRide = trackElementsOnTile.filter((e) => e.element.ride === ride);

	if (trackForThisRide.length === 0) {
		debug(`Error: no track elements found for ride ${ride} at (${coords.x}, ${coords.y})`);
		return undefined;
	}

	if (trackForThisRide.length === 1) {
		return trackForThisRide[0];
	}

	// if there are two segments for the same ride in this tile, make sure it's the proper one
	if (trackForThisRide.length > 1) {
		// comparing z is not as straightforward becauase it has to account for the height of down segments.
		// const zModifiers = trackForThisRide.map(e => {
		//     const trackType = context.getTrackSegment(Number(e.element.trackType));
		//     return <number>trackType?.beginZ;
		// });

		let chosenTrack = trackForThisRide.filter((t, index) => {
			const actualZ = t.segment?.location.z;
			const actualDirection = t.segment?.location.direction;
			const doesDirectionMatch = actualDirection === coords.direction;

			const doesZMatch: boolean = actualZ === coords.z;
			const doZAndDirectionMatch = doesZMatch && doesDirectionMatch;

			if (doZAndDirectionMatch) {
				// debug(`Found the right track element!:
				//      Element ${index} as ${TrackElementType[t.element.trackType]} at height ${actualZ} with zModifier ${zModifiers[index]} and direction ${actualDirection}`);
				return doZAndDirectionMatch;
			}

			// debug(`Both z and direction did not match. Next trying to with x, y, and z (but not direction)`);

			const actualX = t.segment?.location.x;
			const actualY = t.segment?.location.y;

			const doesXMatch = actualX === coords.x;
			const doesYMatch = actualY === coords.y;
			// if x y and z match but not direction, maybe we check the element sequence.
			if (doesXMatch && doesYMatch && doesZMatch) {
				debug(
					` ! ! 1 ! ! ! ! ! x, y, and z match, but not direction. Does element ${index} as ${
						TrackElementType[t.element.trackType]
					} seem rational?`
				);
				return true;
			}
			// debug(`Element ${index} did not match either (z & direction) nor (x,z,y).`);
			return false;
		});

		if (chosenTrack.length === 0) {
			debug(`Error: No matching segments were found (but at least one should have been), so this is going to error out undefined downstream.
            `);
			return undefined;
		}
		if (chosenTrack.length === 2) {
			if (chosenTrack[0].element.trackType === chosenTrack[1].element.trackType) {
				// debug(`there were two segments, there, but they're both the exact same track type (${TrackElementType[chosenTrack[0].element.trackType]}) – so we'll return it.`);
				return chosenTrack[0];
			}
		}

		if (chosenTrack.length > 1) {
			// debug(`Multiple elements match z & direction. Comparing x & y to filter.`);
			// debug(`There are multiple different overlapping elements at this tile with the same z and direction – ${chosenTrack.map(track => TrackElementType[track.element.trackType])}. Now comparing the x and y. FYI, Was looking for an element matched the coords:
			// ${JSON.stringify(coords)}`);
			// debug(`the occupied Quadrants of the elements is ${chosenTrack.map(track => track.element.occupiedQuadrants)}`);

			const matchingAllCoords = chosenTrack.filter((t) => {
				const actualX = t.segment?.location.x;
				const actualY = t.segment?.location.y;
				const doesXMatch = actualX === coords.x;
				const doesYMatch = actualY === coords.y;
				if (doesXMatch && doesYMatch) {
					// debug(`X and y match for element ${index}.`);
					return true;
				}
				// debug(`x and y do not match for element ${index}.`);
				return false;
			});
			chosenTrack = matchingAllCoords;
			// chosenTrack.length > 1
			// ? debug(`After comparison, there are ${chosenTrack.length} elements that match all coords. Returning the first one.`)
			// : debug(`After comparison, there is only one element that matches all coords. Returning it.`);
		}
		return chosenTrack[0];
	}
	return undefined;
};
