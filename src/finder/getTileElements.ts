import { debug } from "~/utilities/logger";
import { Segment } from "~/track/segment";
import { isRideAStall } from "~/utilities/isRideAStall";

/**
 * A specific track-based TileElementItem to keep typing cleaner
 */
export interface TrackElementItem extends TileElementItem<TrackElement> {
	segment: Segment | null;
}

/**
 * Utility function to get a specific type of TileElement at a given CoordsXY
 * @returns
 */
export const getTileElements = <T extends TileElement>(
	elementType: TileElementType,
	/** Bigger numbers, not yet divided by 32 */
	coords: CoordsXY
): TileElementItem<T>[] => {
	// debug(`Querying tile for ${elementType} elements at coords (${coords.x}, ${coords.y})`);

	// have to divide the mapCoords by 32 to get the tile coords
	const selectedTile = map.getTile(coords.x / 32, coords.y / 32);

	// filter and map to elements of the given type
	const reducedELements = selectedTile.elements.reduce<TileElementItem<T>[]>(
		(filtered, el, index) => {
			if (el.type === elementType) {
				return filtered.concat({
					element: <T>el,
					index: index,
					coords,
				});
			}
			return filtered;
		},
		[]
	);
	return reducedELements;
};

/**
 * Utility function to get all "surface" elements at a given coords.
 */
export const getSurfaceElements = ({
	coords,
}: {
	coords: CoordsXY | CoordsXYZ | CoordsXYZD;
}): TileElementItem<SurfaceElement>[] => {
	return getTileElements<SurfaceElement>("surface", { x: coords.x, y: coords.y });
};

/**
 * Get the robust TrackElementItems for a given coords.
 */
export const getTrackElements = (coords: CoordsXY): TrackElementItem[] => {
	// get all the track tile elements at coords
	const potentialTrackElements = getTileElements<TrackElement>("track", coords);
	// filter out the stalls since we don't care about those
	const trackElementsWithoutStalls = potentialTrackElements.filter(
		(t) => !isRideAStall(t.element.ride)
	);
	// get the segment for each track element
	const theseTrackEementsWithSegments = trackElementsWithoutStalls
		.map((e) => {
			const thisSegment = getSegmentFromTrackElement(e);
			if (!thisSegment) {
				debug(`Unable to get segment for coords (${e.coords.x}, ${e.coords.y})`);
				return;
			}
			return { ...e, segment: thisSegment };
		})
		.filter((e) => e !== undefined) as TrackElementItem[];

	return theseTrackEementsWithSegments;
};

/**
 * Utility to get the segment data at a TileElementItem.
 */
const getSegmentFromTrackElement = (e: TileElementItem<TrackElement>): Segment | undefined => {
	const tempTI = map.getTrackIterator(e.coords, e.index);
	if (!tempTI) {
		debug(`Unable to get trackIterator for coords (${e.coords.x}, ${e.coords.y})`);
		return undefined;
	}
	if (!tempTI.segment) {
		debug(`Unable to get segment for coords (${e.coords.x}, ${e.coords.y})`);
		return undefined;
	}
	return new Segment({
		location: tempTI.position,
		trackType: tempTI.segment.type,
		rideType: e.element.rideType,
		ride: e.element.ride,
	});
};
