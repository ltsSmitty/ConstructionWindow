/**
 * Since stalls are also considered rides, use this filter to check stall vs true ride
 * @param rideNumber  @returns true if stall, false if other kind of ride.
 */
export const isRideAStall = (rideNumber: number): boolean => {
	return map.getRide(rideNumber)?.classification === "stall";
};
