import { debug } from "~/utilities/logger";
import { buildState, segmentState } from "~/stores";

const iterateSelection = ({ direction }: { direction: BuildDirection }): boolean => {
	buildState.direction.set(direction);
	debug(`Moving toward ${direction}`);
	return segmentState.iterateSelectionInDirection(direction);
};

export default iterateSelection;
