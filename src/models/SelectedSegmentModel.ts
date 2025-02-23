import { TStore } from "~/stores";
import { Segment } from "~/track/segment";
import { SuccessProps } from "~/models/BuildModel";
import { compute, store } from "openrct2-flexui";
import * as finder from "~/finder";
import { debug } from "~/utilities/logger";

interface SelectedSegmentModelState {
	selectedSegment: TStore<Segment>;
	hasNext: TStore<finder.NextSegmentType>;
	hasPrevious: TStore<finder.NextSegmentType>;
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

class SelectedSegmentModelObj implements SelectedSegmentModel {
	selectedSegment = store<Segment | undefined>();
	private tiAtSegment = compute(this.selectedSegment, (selectedSegment) =>
		finder.getTIAtSegment({ segment: selectedSegment })
	);
	hasNext = compute(this.selectedSegment, this.tiAtSegment, (selectedSegment, tiAtSegment) => {
		if (!selectedSegment || !tiAtSegment) {
			debug(`No segment or TI`);
			return;
		}
		return finder.doesSegmentHaveNextSegment({
			selectedSegment,
			tiAtSegment,
			buildDirection: "next",
		});
	});
	hasPrevious = compute(
		this.selectedSegment,
		this.tiAtSegment,
		(selectedSegment, tiAtSegment) => {
			if (!selectedSegment || !tiAtSegment) {
				debug(`No segment or TI`);
				return;
			}
			return finder.doesSegmentHaveNextSegment({
				selectedSegment,
				tiAtSegment,
				buildDirection: "previous",
			});
		}
	);
	nextPosition = compute(this.tiAtSegment, (tiAtSegment) => {
		return tiAtSegment?.nextPosition ?? undefined;
	});

	previousPosition = compute(this.tiAtSegment, (tiAtSegment) => {
		return tiAtSegment?.previousPosition ?? undefined;
	});

	updateSegment(segment: Segment): SuccessProps {
		this.selectedSegment.set(segment);
		return { success: true };
	}

	next(): SuccessProps {
		if (this.hasNext.get() === "real") {
			this.tiAtSegment.get()?.next();
			const newLocation = this.tiAtSegment.get()?.position;
			if (newLocation) {
				const newSegment = new Segment({
					location: newLocation,
					ride: this.selectedSegment.get()!.ride,
					trackType: this.tiAtSegment.get()!.segment?.type!,
					/**
					 * Need to be exhaustive about this because the ride might be hacked to have
					 * non-standard track elements.
					 */
					rideType: finder.getTrackElementFromSegment({
						ride: this.selectedSegment.get()?.ride!,
						location: newLocation,
					})?.element.rideType!,
				});
				this.selectedSegment.set(newSegment);
				return { success: true };
			}
			return { success: false, reason: "No new location" };
		}
		return { success: false, reason: "No next real segment" };
	}

	previous(): SuccessProps {
		if (this.hasPrevious.get() === "real") {
			this.tiAtSegment.get()?.previous();
			const newLocation = this.tiAtSegment.get()?.position;
			if (newLocation) {
				const newSegment = new Segment({
					location: newLocation,
					ride: this.selectedSegment.get()!.ride,
					trackType: this.tiAtSegment.get()!.segment?.type!,
					/**
					 * Need to be exhaustive about this because the ride might be hacked to have
					 * non-standard track elements.
					 */
					rideType: finder.getTrackElementFromSegment({
						ride: this.selectedSegment.get()?.ride!,
						location: newLocation,
					})?.element.rideType!,
				});
				this.selectedSegment.set(newSegment);
				return { success: true };
			}
			return { success: false, reason: "No new location" };
		}
		return { success: false, reason: "No next real segment" };
	}
}

export const selectedSegmentModel = new SelectedSegmentModelObj();
