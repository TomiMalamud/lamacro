import { NumericFormat, type NumericFormatProps } from "react-number-format";
import { Input } from "@/components/ui/input";

export function NumericInput({
  decimalScale = 2,
  allowNegative = false,
  ...props
}: NumericFormatProps) {
  const { isAllowed: originalIsAllowed, ...rest } = props;
  return (
    <NumericFormat
      thousandSeparator="."
      decimalSeparator=","
      allowedDecimalSeparators={[",", "."]}
      decimalScale={decimalScale}
      allowNegative={allowNegative}
      customInput={Input}
      isAllowed={(values) => {
        if (values.value === "" || values.formattedValue === "") return true;
        return originalIsAllowed ? originalIsAllowed(values) : true;
      }}
      {...rest}
    />
  );
}
