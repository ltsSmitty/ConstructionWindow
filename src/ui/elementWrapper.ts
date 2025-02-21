import {
	button,
	toggle,
	ButtonParams,
	ToggleParams,
	FlexiblePosition,
	WidgetCreator,
} from "openrct2-flexui";
import { buttonState } from "~/stores";
import { onButtonChange } from "~/ui/buttons/controls/onButtonChange";
import { shouldThisBePressed } from "~/ui/buttons/controls/toggleIsPickedControls";

// import { debug } from '../utilities/logger';

type ExtendedToggleParams = ToggleParams & {
	buttonType: BuildWindowButton;
};

type ExtendedButtonParams = ButtonParams & {
	buttonType: BuildWindowButton;
};

export class ElementWrapper {
	public button(
		params: ExtendedButtonParams & FlexiblePosition
	): WidgetCreator<FlexiblePosition> {
		const { buttonType, onClick, ...rest } = params;
		return button({
			disabled: buttonState.enabledButtons[buttonType],
			visibility: buttonState.visibleButtons[buttonType],
			onClick: () => {
				if (onClick) return onClick(); //override default behaviour if another is provided

				return onButtonChange({
					buttonType,
					pressState: "oneTime",
				});
			},
			...rest,
		});
	}

	public toggle(
		params: ExtendedToggleParams & FlexiblePosition
	): WidgetCreator<FlexiblePosition> {
		const { buttonType, onChange, ...rest } = params;

		return toggle({
			disabled: buttonState.enabledButtons[buttonType],
			visibility: buttonState.visibleButtons[buttonType],
			onChange: (isPressed?) => {
				if (onChange) return onChange(isPressed ?? false); //override default behaviour if another is provided

				return onButtonChange({
					buttonType,
					pressState: isPressed ? "pressed" : "notPressed",
				});
			},
			isPressed: shouldThisBePressed({ buttonType }),
			...rest,
		});
	}
}
