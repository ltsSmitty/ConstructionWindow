import { segmentState, SegmentStore } from "~/stores";
import { Segment } from "~/track/segment";
import { highlightMapRangeUnderSegment } from "~/ui/tools/highlightGround";
import { debug } from "~/utilities/logger";

class SegmentPainter {
	constructor(segmentState: SegmentStore) {
		segmentState.selectedSegment.subscribe((newSeg) => {
			debug(`selected segment changed`);
			this.highlightRangeUnderSegment({ segment: newSeg });
		});
	}

	public highlightRangeUnderSegment({ segment }: { segment: Segment | undefined }): void {
		highlightMapRangeUnderSegment({ segment });
	}
}

export const segmentPainter = new SegmentPainter(segmentState);
