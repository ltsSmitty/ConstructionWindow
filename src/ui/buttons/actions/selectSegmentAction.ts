import { debug } from "~/utilities/logger";
import { toggleXYPicker } from "~/ui/tools/xyPicker";
import * as finder from "~/finder";
import { segmentState, trackElementsOnSelectedTile, buttonState } from "~/stores";
import { type Segment } from "~/track/segment";

const selectSegment = (isPressed: boolean): Segment | undefined => {
	if (isPressed) {
		debug(`selecting segment`);

		// buttonState.updateControl({ button: "select", isPressed: "pressed" });

		// open the picker tool
		toggleXYPicker(
			isPressed,
			(coords) => {
				// onPick
				// get all the track elements on the selected tile
				const elementsOnCoords = finder.getTrackElements(coords);
				trackElementsOnSelectedTile.set(elementsOnCoords);
				// if there's at least one, set that as the selected segment
				if (trackElementsOnSelectedTile.get().length > 0) {
					// set the segment state relative to the first one found.
					segmentState.updateSegmentSequence(
						trackElementsOnSelectedTile.get()[0].segment
					);
				}
			},
			() => {
				// onCancel

				// TODO reimplement
				// have to do this because the highlighter cancels at this stage
				// segmentModel.segmentState.segmentPainter.highlightRangeUnderSegment({
				// 	segment: segmentState.selectedSegment.get(),
				// });
				buttonState.updateControl({
					button: "select",
					isPressed: "notPressed",
				});
				debug(`selection finished`);
			}
		);
	}
	return segmentState.selectedSegment.get();
};

export default selectSegment;
