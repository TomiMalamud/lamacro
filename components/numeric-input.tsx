import { NumericFormat, type NumericFormatProps } from "react-number-format";
import { Input } from "@/components/ui/input";

export function NumericInput({
  decimalScale = 2,
  allowNegative = false,
  ...props
}: NumericFormatProps) {
  return (
    <NumericFormat
      thousandSeparator="."
      decimalSeparator=","
      allowedDecimalSeparators={[",", "."]}
      decimalScale={decimalScale}
      allowNegative={allowNegative}
      customInput={Input}
      {...props}
    />
  );
}
