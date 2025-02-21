export const simulateRide = (ride: number, activate: boolean): void => {
	// use context.executeAction to call ridesetstatus with a type of 4, this ride, status of 3 and flags of 0
	const simulationArgs = {
		type: 8,
		ride,
		status: activate ? 3 : 0,
		flags: 0,
	};
	context.executeAction("ridesetstatus", simulationArgs, () => {
		console.log(`Simulation started for ride ${ride}`);
	});
};
