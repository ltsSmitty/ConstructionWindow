import { debug } from "~/utilities/logger";
import { compute, WritableStore } from "openrct2-flexui";
import { buttonState } from "~/stores";
import { assertButton } from "~/ui/buttons/controls/buttonAssertions";

export const shouldThisBePressed = ({
	buttonType,
}: {
	buttonType: BuildWindowButton;
}): WritableStore<boolean> => {
	const { buttonPressCombination } = buttonState;

	if (assertButton.isBankButton(buttonType)) {
		return compute(buttonPressCombination.bank, (b) => {
			debug(`shouldThisBePressed: bank button ${buttonType} is ${b === buttonType}`);
			if (b === buttonType) {
				return true;
			} else {
				return false;
			}
		});
	}
	// do the same with curve and pitch
	if (assertButton.isCurveButton(buttonType)) {
		return compute(buttonPressCombination.curve, (b) => {
			// debug(`shouldThisBePressed: curve button ${buttonType} is ${b === buttonType}`);
			if (b === buttonType) {
				return true;
			} else {
				return false;
			}
		});
	}

	if (assertButton.isPitchButton(buttonType)) {
		return compute(buttonPressCombination.pitch, (b) => {
			// debug(`shouldThisBePressed: pitch button ${buttonType} is ${b === buttonType}`);
			if (b === buttonType) {
				return true;
			} else {
				return false;
			}
		});
	}
	return buttonState.pressedButtons[buttonType];
};
