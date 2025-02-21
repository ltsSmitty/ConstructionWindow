import { Segment } from "~/track/segment";
import * as finder from "~/finder";
import { debug } from "~/utilities/logger";
import { TrackElementType } from "~/constants";
import { isEqual, findLastIndex } from "lodash-es";

type SequenceResult = {
	sequence: Segment[];
	indexOfInitialSegment: number;
	isCircuit: boolean;
};

const createRawSegmentSequence = ({ segment }: { segment: Segment }): SequenceResult => {
	const initialSegment = segment;
	const sequence: Segment[] = [initialSegment];
	let indexOfInitialSegment = -1;
	let isCircuit = false;

	if (initialSegment == null) {
		debug("Initial segment invalid: null");
		return { sequence: [], indexOfInitialSegment, isCircuit };
	}

	// iterate through backwards with a TI. if we find a end station, save that as a reference
	// get the TI for iterating
	const reverseIterator = finder.getTIAtSegment({ segment: initialSegment });
	if (reverseIterator == null) {
		debug("Initial segment invalid: no TI found");
		return { sequence: [], indexOfInitialSegment, isCircuit };
	}

	// intiailize the first end station to null
	let firstEndStation: Segment | null = null;
	let i = 0;
	// Loop backwards until we find a end station or an end
	while (reverseIterator.previous() && i < 2000) {
		// debug(`Moving backwards, loop ${i},  TET ${TrackElementType[reverseIterator.segment?.type ?? 0]}`);
		const newSegment: Segment = new Segment({
			location: reverseIterator.position,
			ride: initialSegment.ride,
			trackType: reverseIterator.segment?.type ?? 0,
			rideType:
				finder.getTrackElementFromSegment({
					ride: initialSegment.ride,
					location: reverseIterator.position,
				})?.element.rideType ?? -1,
		});

		// if a begin station is found, check if it matches the first begin station
		// if it does, we've got a coomplete circuit
		if (newSegment.trackType == TrackElementType.EndStation) {
			debug(`Found end station.`);
			if (firstEndStation == null) {
				// debug(`First end station found, saving as reference`);
				firstEndStation = newSegment;
			} else {
				// debug(`Another EndStation found, checking if it matches`);
				if (areSegmentsEqual(firstEndStation, newSegment)) {
					// at this point the entire track has been created. ready to return.
					// debug(`Complete circuit found, returning`);
					isCircuit = true;
					return { sequence, indexOfInitialSegment: sequence.length - 1, isCircuit };
				} else {
					// debug(`End stations don't match, adding to sequence`);
				}
			}
		}
		// add the new segment to the front of the array
		sequence.unshift(newSegment);
		i++;
	}

	// if we get this far, that means it is not a circuit. so just loop forward until next is false.
	// now that we're done unshifting, we can set the index of the initial segment
	// everything after this will push onto the array.
	indexOfInitialSegment = sequence.length - 1;

	// get a separate iterator to move forward
	const forwardIterator = finder.getTIAtSegment({ segment: initialSegment });
	if (forwardIterator == null) {
		debug("Initial segment invalid: no TI found");
		return { sequence: [], indexOfInitialSegment, isCircuit };
	}
	// Loop forwards until we find the same beginStation or an end
	// debug(`about to start looping forwards, loop ${i}`);
	while (forwardIterator.next() && i < 200) {
		// debug(`Moving forwards, loop ${i}, TET ${TrackElementType[forwardIterator.segment?.type ?? 0]}`);
		const newSegment: Segment = new Segment({
			location: forwardIterator.position,
			ride: initialSegment.ride,
			trackType: forwardIterator.segment?.type ?? 0,
			rideType:
				finder.getTrackElementFromSegment({
					ride: initialSegment.ride,
					location: forwardIterator.position,
				})?.element.rideType ?? -1,
		});
		sequence.push(newSegment);
		i++;
	}

	return { sequence, indexOfInitialSegment, isCircuit };
};

/** Shift a circuitous sequence so that it's first element is the first track piece and the last element is the EndStation. If the sequence is not a circuit or doesn't have a BeginStation, return the original SequenceResult. */
const shiftRawCircuitSequence = ({
	sequenceResult,
}: {
	sequenceResult: SequenceResult;
}): SequenceResult => {
	// go through the sequenceResult.sequence until it finds the first index of a begin station, and then shift all the elements to the left until that index is 0
	// then return the new sequenceResult
	const { sequence, indexOfInitialSegment, isCircuit } = sequenceResult;
	if (!isCircuit) {
		return sequenceResult;
	}
	const indexOfLastEndStation = findLastIndex(
		sequence,
		(segment) => segment.trackType == TrackElementType.EndStation
	);
	if (indexOfLastEndStation == -1) {
		return sequenceResult;
	}
	// sequence.forEach((segment, index) => {
	//     debug(`segment ${index}: ${TrackElementType[segment.trackType]}`);
	// });

	// Have the sequence start with the first piece after the end station, and the final piece is the end station
	const newSequence = sequence.slice(0, indexOfLastEndStation + 1);

	// account for the selected segment potentially being before the BeginStation. if it is, we need to add the length of the sequence to the index
	const newSelectedSegmentIndex =
		indexOfInitialSegment - indexOfLastEndStation > 0
			? indexOfInitialSegment - indexOfLastEndStation - 1
			: newSequence.length + (indexOfInitialSegment - indexOfLastEndStation);
	// debug(`newSelectedSegmentIndex: ${newSelectedSegmentIndex}`);

	// newSequence.forEach((segment, index) => {
	//     debug(`segment ${index}: ${TrackElementType[segment.trackType]}`);
	// });

	// debug(`rest:`);
	// sequence.slice(0, indexOfFirstEndStation).forEach((segment, index) => {
	//     debug(`segment ${index}: ${TrackElementType[segment.trackType]}`);
	// });
	return { sequence: newSequence, indexOfInitialSegment: newSelectedSegmentIndex, isCircuit };
};

const areSegmentsEqual = (segment1: Segment, segment2: Segment): boolean => {
	return (
		isEqual(segment1.location, segment2.location) &&
		segment1.ride == segment2.ride &&
		segment1.trackType == segment2.trackType
	);
};

/** Create a segment sequence from a given initial segment.
 * If the ride forms a complete circuit, this will return a sequence beginning at a BeginStation.
 * The index of the initial segment is returned in the return object so it doesn't need to searched for later.
 * */
const createSegmentSequence = (initialSegment: Segment | null): SequenceResult => {
	if (initialSegment == null) {
		return { sequence: [], indexOfInitialSegment: -1, isCircuit: false };
	}
	const rawSequenceResult = createRawSegmentSequence({ segment: initialSegment });
	return shiftRawCircuitSequence({ sequenceResult: rawSequenceResult });
};

export default createSegmentSequence;
