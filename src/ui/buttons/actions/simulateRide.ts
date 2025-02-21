import { simulateRide as simulateRideAction } from "~/gameActions/simulateRide";
import { segmentState } from "~/stores";

export const simulateRide = (activate: boolean): void => {
	const thisRide = segmentState.selectedSegment.get()?.ride;
	return simulateRideAction(thisRide || 0, activate);
};
