"use client";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { NumericInput } from "../numeric-input";
import type { NumberFormatValues } from "react-number-format";
import { useDebouncedCallback } from "use-debounce";

export default function CarryExitInput() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { replace } = useRouter();

  const handleInput = useDebouncedCallback((term: string) => {
    const params = new URLSearchParams(searchParams);
    if (term) {
      params.set("custom_mep", term);
    } else {
      params.delete("custom_mep");
    }
    replace(`${pathname}?${params.toString()}`, { scroll: false });
  }, 300);

  return (
    <NumericInput
      className="w-full max-w-xs"
      placeholder="Ingresá un valor de dólar"
      onValueChange={(values) => {
        handleInput(values.value || "");
      }}
      isAllowed={(values: NumberFormatValues): boolean => {
        const numericValue = parseFloat(values.value || "0");
        return !isNaN(numericValue) && numericValue <= 5000;
      }}
      prefix="$"
      defaultValue={searchParams.get("custom_mep")?.toString() || ""}
    />
  );
}
