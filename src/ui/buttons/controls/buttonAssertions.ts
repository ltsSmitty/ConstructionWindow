const isCurveButton = (button: BuildWindowButton): button is CurveButton => {
	return (
		button === "left1Tile" ||
		button === "left3Tile" ||
		button === "left5Tile" ||
		button === "noCurve" ||
		button === "right1Tile" ||
		button === "right3Tile" ||
		button === "right5Tile" ||
		button === "leftLargeTurn" ||
		button === "rightLargeTurn"
	);
};
const isBankButton = (button: BuildWindowButton): button is BankButton => {
	return button === "bankLeft" || button === "bankRight" || button === "noBank";
};

const isPitchButton = (button: BuildWindowButton): button is PitchButton => {
	return (
		button === "down90" ||
		button === "down60" ||
		button === "down25" ||
		button === "noPitch" ||
		button === "up25" ||
		button === "up60" ||
		button === "up90"
	);
};

export const isDetailButton = (button: BuildWindowButton): button is DetailButton => {
	return button === "chainLift" || button === "covered";
};

export const isMiscButton = (button: BuildWindowButton): button is MiscButton => {
	return (
		button === "boosters" ||
		button === "camera" ||
		button === "brakes" ||
		button === "blockBrakes" ||
		button === "entrance" ||
		button === "exit" ||
		button === "sBendLeft" ||
		button === "sBendRight"
	);
};

const isSpecialButton = (button: BuildWindowButton): button is SpecialButton => {
	return button === "special";
};

const isControlButton = (button: BuildWindowButton): button is ControlButton => {
	return (
		button === "demolish" ||
		button === "iterateNext" ||
		button === "select" ||
		button === "iteratePrevious" ||
		button === "simulate" ||
		button === "build"
	);
};

export const assertButton = {
	isBankButton,
	isCurveButton,
	isControlButton,
	isDetailButton,
	isMiscButton,
	isPitchButton,
	isSpecialButton,
};
