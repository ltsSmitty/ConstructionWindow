import { debug } from "~/utilities/logger";
import { ArrayStore, arrayStore, store } from "openrct2-flexui";
import { TStore } from "~/stores/build";
import { Segment } from "~/track/segment";
import { AutoCatchErrors } from "~/utilities/errorCatcher";
import createSegmentSequence from "~/track/computations/createSegmentSequence";

interface SegmentStoreState {
	segmentSequence: ArrayStore<Segment>;
	selectedIndex: TStore<number>;
	selectedSegment: TStore<Segment>;
	isCompleteCircuit: TStore<boolean>;
}

interface SegmentStoreActions {
	updateSegmentSequence: (initialSegment: Segment) => void;
	hasNext: () => boolean;
	hasPrevious: () => boolean;
	iterateSelectionInDirection: (direction: BuildDirection) => boolean;
	getBuildLocation: (direction: BuildDirection) => CoordsXYZD | undefined;
}

@AutoCatchErrors
class SegmentStore implements SegmentStoreState, SegmentStoreActions {
	/**    The selected sequence of segments in a row    */
	segmentSequence: ArrayStore<Segment>;
	selectedIndex: TStore<number>;

	/**   The currently selected segment, dependant on the sequence and the selected index   */
	selectedSegment: TStore<Segment>;
	/**   Whether the sequence of segments is a complete circuit    */
	isCompleteCircuit: TStore<boolean>;

	constructor() {
		this.segmentSequence = arrayStore([]);
		this.selectedIndex = store(0);
		this.selectedSegment = store();
		this.isCompleteCircuit = store(false);
	}

	updateSegmentSequence(initialSegment: Segment) {
		const { sequence, indexOfInitialSegment } = createSegmentSequence(initialSegment);
		this.segmentSequence.set(sequence);
		this.selectedIndex.set(indexOfInitialSegment);
		this.selectedSegment.set(sequence[indexOfInitialSegment]);
	}

	/**
	 * Check if the selectedSegment from the segment sequence state has a proceeding segment in the next direction
	 */
	hasNext() {
		const thisIndex = this.selectedIndex.get() ?? 0;
		return !!(
			thisIndex < this.segmentSequence.get().length - 1 || this.isCompleteCircuit.get()
		);
	}

	/**
	 * Check if the selectedSegment from the segment sequence state has a proceeding segment in the previous direction
	 */
	hasPrevious() {
		const thisIndex = this.selectedIndex.get() ?? 0;
		return !!(
			thisIndex > this.segmentSequence.get().length - 1 || this.isCompleteCircuit.get()
		);
	}

	/** Iterate the selected segment in the direction provided. Returns true if it successfully iterates, returns false if it's unable to iterate.*/
	iterateSelectionInDirection(direction: BuildDirection) {
		if (this.selectedIndex.get() == null) throw new Error("No selected index.");
		if (direction === "next") {
			return !!this.setSelectedSegment({ index: this.selectedIndex.get()! + 1 });
		}
		return !!this.setSelectedSegment({ index: this.selectedIndex.get()! - 1 });
	}

	/**
	 * Get the initial build location which a TI provides at the end of the segment sequence in the direction provided.
	 * This location will need to be normalized to deal with track element type factors (e.g. segment sloped down, helixes, etc.)
	 */
	getBuildLocation(direction: BuildDirection) {
		if (this.selectedIndex.get() == null) throw new Error("No selected index.");
		const index = this.selectedIndex.get()!;
		const segment = this.segmentSequence.get()[index];
		if (segment == null) {
			debug(`No segment found at index, ${index}`);
			return;
		}
		const { location } = segment;
		return location;
	}

	/** Set the selected segment to the index provided.
	 * If the index is out of bounds, it will check for a complete circuit, and return either the 0th or last element.
	 * E.g. If given -5 for the index and is complete circuit, will still return the last index, not the (last - 5th). */
	private setSelectedSegment({ index }: { index: number }): Segment | undefined {
		const segments = this.segmentSequence.get();

		// see if it should wrap around backwards

		if (this.isCompleteCircuit.get()) {
			// debug(`complete circuit, so open to wrapping`);
			if (index < 0) {
				// don't fully wrap, just wrap to the last element
				// this also sets the selected segment
				this.selectedSegment.set(segments[segments.length - 1]);
				this.selectedIndex.set(segments.length - 1);
				// debug(`wrapped index back to ${segments.length - 1}`);
				return this.selectedSegment.get();
			}
			// see if it should wrap around forwards
			if (index >= segments.length) {
				// don't fully wrap, just wrap to the first element
				// this also sets the selected segment
				this.selectedSegment.set(segments[0]);
				this.selectedIndex.set(0);
				// debug(`wrapped index back to 0`);
				return this.selectedSegment.get();
			}
			this.selectedIndex.set(index);
			this.selectedSegment.set(segments[index]);
		} else {
			// not a circuit
			if (index < 0 || index >= segments.length) {
				debug("SegmentSequence.setSelectedSegment: index out of bounds");
				return;
			}
			// set the new index and selected segment
			this.selectedIndex.set(index);
			this.selectedSegment.set(segments[index]);
		}
		return this.selectedSegment.get();
	}
}

const segmentStore = new SegmentStore();

export { segmentStore, type SegmentStore };
