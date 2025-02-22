import { debug } from "~/utilities/logger";
import * as finder from "~/finder";
import { Segment } from "~/track/segment";
import { filter } from "lodash-es";

/**
 *  Use the built in ui.tileSelection to highlight the ground tiles under the segment.
 */
export const highlightMapRangeUnderSegment = ({
	segment,
	callback,
}: {
	segment: Segment | undefined;
	callback?: (result: boolean) => void;
}): void => {
	if (segment == null) {
		debug(`Unable to highlight map range. Segment is null, painting test range`);
		setUITileSelection(null);
		return;
	}
	const thisTI = finder.getTIAtSegment(segment);
	if (thisTI == null) {
		debug(`Unable to find TI for segment ${JSON.stringify(segment)}`);
		return;
	}

	const segmentElements = finder.getAllSegmentTrackElements({ segment, thisTI });

	if (segmentElements.length == 0) {
		debug(`the segmentElement array is empty`);

		return;
	}

	const tiles = segmentElements.map((segmentElement) => {
		return segmentElement.coords;
	});
	const result = setUITileSelection({ tiles });
	if (callback) callback(result);
};

export const highlightSelectedElements = (segment: Segment | null): void => {
	if (segment == null) {
		return;
	}
	// const selectedElement = finder.getSpecificTrackElement(segment.ride, segment.location);
	// for each event in selectElenents, highlight the tile
	// selectedElement.element.isHighlighted = true;
	// todo figure out a better way to highligth a segment since highlight is the same as ghost
};

const setUITileSelection = (
	params: { mapRange?: MapRange | null; tiles?: CoordsXY[] } | null
): boolean => {
	const { mapRange, tiles } = params || {};
	if (mapRange == null && tiles == null) {
		debug(`Unable to highlight map range. No coords given.`);
		return false;
	}
	if (mapRange) {
		if (
			mapRange.leftTop.x % 32 != 0 ||
			mapRange.leftTop.y % 32 != 0 ||
			mapRange.rightBottom.x % 32 != 0 ||
			mapRange.rightBottom.y % 32 != 0
		) {
			debug(`Unable to highlight map range. Map range is not a multiple of 32`);
			return false;
		}
		debug(`Setting ui.tileSelection.range to ${JSON.stringify(mapRange)}`);
		ui.tileSelection.range = mapRange;
		return true;
	}
	if (tiles) {
		const badTiles = filter(tiles, (tile) => {
			tile.x % 32 != 0 || tile.y % 32 != 0;
		});
		if (badTiles.length > 0) {
			debug(`Unable to highlight map range. Map range tiles are not multiples of 32`);
			return false;
		}
		// debug(`Setting ui.tileSelection.tiles to ${JSON.stringify(tiles)}`);
		ui.tileSelection.tiles = tiles;
		return true;
	}
	return false;
};
