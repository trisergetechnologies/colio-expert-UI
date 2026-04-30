import React from "react";

let realPicker: any = null;

try {
  const pkg = "@react-native-community/datetimepicker";
  // Dynamic require avoids Metro hard-failing when dependency is absent.
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  realPicker = require(pkg);
} catch (error) {
  console.warn(
    "[dateTimePickerCompat] @react-native-community/datetimepicker not installed, using fallback."
  );
}

export const hasNativeDateTimePicker = Boolean(realPicker?.default);

const FallbackPicker = () => null;

const DateTimePickerCompat = (realPicker?.default ?? FallbackPicker) as React.ComponentType<any>;

export default DateTimePickerCompat;
