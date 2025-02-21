import { TrackElementType, RideType } from "~/constants";

export class Segment {
	ride: number;
	trackType: TrackElementType;
	rideType: RideType;
	location: CoordsXYZD;
	constructor({
		ride,
		trackType,
		rideType,
		location,
	}: {
		ride: number;
		trackType: TrackElementType;
		rideType: RideType;
		location: CoordsXYZD;
	}) {
		this.ride = ride;
		this.trackType = trackType;
		this.rideType = rideType;
		this.location = location;
	}
}
