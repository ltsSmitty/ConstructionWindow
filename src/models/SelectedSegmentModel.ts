import { TStore } from "~/stores";
import { Segment } from "~/track/segment";
import { SuccessProps } from "~/models/BuildModel";

interface SelectedSegmentModelState {
	selectedSegment: TStore<Segment>;
	hasNext: TStore<boolean>;
	hasPrevious: TStore<boolean>;
	nextPosition: TStore<CoordsXYZD>;
	previousPosition: TStore<CoordsXYZD>;
}

interface SelectedSegmentModelActions {
	updateSegment: (segment: Segment) => SuccessProps;
	next: () => SuccessProps;
	previous: () => SuccessProps;
}

export interface SelectedSegmentModel
	extends SelectedSegmentModelState,
		SelectedSegmentModelActions {}
