export function CatchErrors() {
	return function (_target: any, propertyKey: string, descriptor: PropertyDescriptor) {
		const originalMethod = descriptor.value;

		descriptor.value = function (...args: any[]) {
			try {
				return originalMethod.apply(this, args);
			} catch (error) {
				console.error(`Error in ${propertyKey}:`, error);
			}
		};

		return descriptor;
	};
}

export function AutoCatchErrors<T extends { new (...args: any[]): {} }>(constructor: T) {
	return class extends constructor {
		constructor(...args: any[]) {
			super(...args);
			for (const key of Object.getOwnPropertyNames(constructor.prototype)) {
				const descriptor = Object.getOwnPropertyDescriptor(constructor.prototype, key);
				if (descriptor && typeof descriptor.value === "function") {
					Object.defineProperty(this, key, CatchErrors()(this, key, descriptor));
				}
			}
		}
	};
}
