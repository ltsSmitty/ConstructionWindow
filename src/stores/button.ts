/* eslint-disable @typescript-eslint/restrict-template-expressions */
// import { getButtonsForElement } from './../buttons/ButtonMap';
import { store, ElementVisibility } from "openrct2-flexui";
// import * as assertButton from '../buttons/ButtonAssertions';
import { cloneDeep, mapValues } from "lodash-es";
import { debug } from "~/utilities/logger";

// instantiate an empty allButtons object
const allButtonsEmpty = {
	left1Tile: store(false),
	left3Tile: store(false),
	left5Tile: store(false),
	noCurve: store(false),
	right1Tile: store(false),
	right3Tile: store(false),
	right5Tile: store(false),
	leftLargeTurn: store(false),
	rightLargeTurn: store(false),
	bankLeft: store(false),
	bankRight: store(false),
	noBank: store(false),
	down90: store(false),
	down60: store(false),
	down25: store(false),
	noPitch: store(false),
	up25: store(false),
	up60: store(false),
	up90: store(false),
	chainLift: store(false),
	covered: store(false),
	sBendLeft: store(false),
	sBendRight: store(false),
	boosters: store(false),
	camera: store(false),
	brakes: store(false),
	blockBrakes: store(false),
	entrance: store(false),
	exit: store(false),
	special: store(false),
	demolish: store(false),
	iterateNext: store(false),
	select: store(false),
	iteratePrevious: store(false),
	simulate: store(false),
	build: store(false),
};

type AllButtonsStores = typeof allButtonsEmpty;

const allButtonsVisibilityEmpty = mapValues(allButtonsEmpty, () =>
	store(<ElementVisibility>"visible")
);

// instantiate an empty ButtonPressCombination object with all null store values
const buttonPressCombinationEmpty = {
	curve: store<CurveButton>(),
	bank: store<BankButton>(),
	pitch: store<PitchButton>(),
	detail: {
		chainLift: store<boolean>(),
		covered: store<boolean>(),
	},
	misc: store<MiscButton>(),
	special: store<SpecialButton>(),
	controls: {
		demolish: store<boolean>(),
		iterateNext: store<boolean>(),
		select: store<boolean>(),
		iteratePrevious: store<boolean>(),
		simulate: store<boolean>(),
		build: store<boolean>(),
	},
};

type ButtonKind = keyof typeof buttonPressCombinationEmpty;

type ButtonPressCombination = typeof buttonPressCombinationEmpty;

type ButtonUpdateProps<T extends BuildWindowButton> = {
	button: T;
	isPressed: ButtonPressOption;
};

interface IButtonStateController {
	/** Buttons/toggles which are actively toggled on and/or are one-time pressed. */
	readonly pressedButtons: AllButtonsStores;
	/** Keep track of which buttons are disabled (cannot be pressed). */
	readonly enabledButtons: AllButtonsStores;
	/** Keep track of which buttons which are visible (cannot be pressed). */
	readonly visibleButtons: typeof allButtonsVisibilityEmpty;

	readonly buttonPressCombination: ButtonPressCombination;

	/** Keep track of the pressed buttons which are used for determining which TrackElementTypes are valid */
	getPressedButtons(): { [key in BuildWindowButton]: boolean };
	getEnabledButtons(): { [key in BuildWindowButton]: boolean };
	getVisibleButtons(): { [key in BuildWindowButton]: ElementVisibility };
	getButtonStatus(button: BuildWindowButton): {
		pressed: boolean;
		enabled: boolean;
		visible: ElementVisibility;
	};

	updateCurve({ button, isPressed }: ButtonUpdateProps<CurveButton>): void;
	updateBank({ button, isPressed }: ButtonUpdateProps<BankButton>): void;
	updatePitch({ button, isPressed }: ButtonUpdateProps<PitchButton>): void;
	updateSpecial({ button, isPressed }: ButtonUpdateProps<SpecialButton>): void;
	updateMisc({ button, isPressed }: ButtonUpdateProps<MiscButton>): void;
	updateDetail({ button, isPressed }: ButtonUpdateProps<DetailButton>): void;
	updateControl({ button, isPressed }: ButtonUpdateProps<ControlButton>): void;
}

class ButtonStateController implements IButtonStateController {
	readonly pressedButtons = cloneDeep(allButtonsEmpty);
	readonly enabledButtons = cloneDeep(allButtonsEmpty);
	readonly visibleButtons = cloneDeep(allButtonsVisibilityEmpty);
	readonly buttonPressCombination = cloneDeep(buttonPressCombinationEmpty);

	/**
	 * Get the state of visiblity, pressed, and enabled for the given button
	 */
	getButtonStatus(button: BuildWindowButton): {
		pressed: boolean;
		enabled: boolean;
		visible: ElementVisibility;
	} {
		return {
			pressed: this.pressedButtons[button].get(),
			enabled: this.enabledButtons[button].get(),
			visible: this.visibleButtons[button].get(),
		};
	}

	getPressedButtons(): { [key in BuildWindowButton]: boolean } {
		const pressedButtons = {} as { [key in BuildWindowButton]: boolean };
		for (const button in this.pressedButtons) {
			const val = this.pressedButtons[<keyof AllButtonsStores>button].get();
			if (val) {
				pressedButtons[<keyof AllButtonsStores>button] = val;
			} else pressedButtons[<keyof AllButtonsStores>button] = false;
		}
		return pressedButtons;
	}

	getEnabledButtons(): { [key in BuildWindowButton]: boolean } {
		const enabledButtons = {} as { [key in BuildWindowButton]: boolean };
		for (const button in this.enabledButtons) {
			const val = this.enabledButtons[<keyof AllButtonsStores>button].get();
			if (val) {
				enabledButtons[<keyof AllButtonsStores>button] = val;
			} else enabledButtons[<keyof AllButtonsStores>button] = false;
		}
		return enabledButtons;
	}

	getVisibleButtons(): { [key in BuildWindowButton]: ElementVisibility } {
		const visibleButtons = {} as { [key in BuildWindowButton]: ElementVisibility };
		for (const button in this.visibleButtons) {
			const val = this.visibleButtons[<keyof AllButtonsStores>button].get();
			if (val) {
				visibleButtons[<keyof AllButtonsStores>button] = val;
			} else visibleButtons[<keyof AllButtonsStores>button] = "none";
		}
		return visibleButtons;
	}

	private updateButton<T extends BuildWindowButton>({
		button,
		isPressed,
		kind,
	}: {
		button: T;
		isPressed: ButtonPressOption;
		kind: ButtonKind;
	}): void {
		if (kind === "detail" || kind === "controls") {
			switch (kind) {
				case "detail":
					this.updateDetail({ button: button as DetailButton, isPressed });
					break;
				case "controls":
					this.updateControl({ button: button as ControlButton, isPressed });
					break;
				default:
					debug(
						`something went wrong in ButtonStateController.updateButton: kind=${kind}`
					);
					break;
			}
			debug(`ButtonStateController.updateButton: kind=${kind}. NOT HANDLED`);
			return; // Handle these cases separately
		}
		const oldPressed = this.buttonPressCombination[kind].get();
		if (oldPressed == button) {
			// if the old pressed button is the same as the new pressed button
			// force the button to be pressed
			this.buttonPressCombination[kind].set(undefined); // the only way to get the store to recalculate is to set it null and then set it to the value
			this.buttonPressCombination[kind].set(button as any);
			return;
		}
		if (oldPressed) {
			// set the old pressed button to not be pressed
			this.pressedButtons[oldPressed].set(false);
		}
		// set the new pressed button to be pressed
		this.pressedButtons[button].set(isPressed == "pressed" ? true : false);
		this.buttonPressCombination[kind].set(button as any);
	}

	updateCurve = ({ button, isPressed }: ButtonUpdateProps<CurveButton>) =>
		this.updateButton({ button, isPressed, kind: "curve" });

	updateBank = ({ button, isPressed }: ButtonUpdateProps<BankButton>): void =>
		this.updateButton({ button, isPressed, kind: "bank" });

	updatePitch = ({ button, isPressed }: ButtonUpdateProps<PitchButton>): void =>
		this.updateButton({ button, isPressed, kind: "pitch" });

	updateSpecial = ({ button, isPressed }: ButtonUpdateProps<SpecialButton>): void =>
		this.updateButton({ button, isPressed, kind: "special" });

	updateMisc = ({ button, isPressed }: ButtonUpdateProps<MiscButton>): void =>
		this.updateButton({ button, isPressed, kind: "misc" });

	// Detail and Controls both are arrays, so they have some different handling
	updateDetail = ({ button, isPressed }: ButtonUpdateProps<DetailButton>): void => {
		this.buttonPressCombination.detail[button].set(isPressed == "pressed" ? true : false);
		this.pressedButtons[button].set(isPressed == "pressed" ? true : false);
	};

	updateControl = ({ button, isPressed }: ButtonUpdateProps<ControlButton>): void => {
		this.buttonPressCombination.controls[button].set(isPressed == "pressed" ? true : false);
		this.pressedButtons[button].set(isPressed == "pressed" ? true : false);
	};
}

export const buttonState = new ButtonStateController();
