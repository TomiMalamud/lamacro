"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Check, ChevronsUpDown } from "lucide-react";

export interface ComboboxDrawerOption<T = unknown> {
  value: T;
  label: string;
}

export interface ComboboxDrawerProps<
  T = unknown,
  O extends ComboboxDrawerOption<T> = ComboboxDrawerOption<T>,
> {
  value: T;
  onValueChange: (value: T) => void;
  options: O[];
  placeholder: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  title?: string;
  className?: string;
  disabled?: boolean;
  renderOption?: (option: O, isSelected: boolean) => React.ReactNode;
  renderTrigger?: (selectedOption: O | undefined) => React.ReactNode;
}

export function ComboboxDrawer<
  T = unknown,
  O extends ComboboxDrawerOption<T> = ComboboxDrawerOption<T>,
>({
  value,
  onValueChange,
  options,
  placeholder,
  searchPlaceholder = "Buscar...",
  emptyMessage = "No se encontró.",
  title,
  className,
  disabled = false,
  renderOption,
  renderTrigger,
}: ComboboxDrawerProps<T, O>) {
  const [open, setOpen] = React.useState(false);
  const [isMobile, setIsMobile] = React.useState(() => {
    if (typeof window !== "undefined") {
      return window.innerWidth < 768;
    }
    return false;
  });

  const selectedOption = React.useMemo(
    () => options.find((option) => option.value === value),
    [options, value],
  );

  React.useEffect(() => {
    const handleResize = () => {
      const newIsMobile = window.innerWidth < 768;
      if (newIsMobile !== isMobile) {
        setIsMobile(newIsMobile);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isMobile]);

  const handleSelect = React.useCallback(
    (optionValue: T) => {
      onValueChange(optionValue);
      setOpen(false);
    },
    [onValueChange],
  );

  const defaultRenderOption = React.useCallback(
    (option: ComboboxDrawerOption<T>, isSelected: boolean) => (
      <>
        <Check
          className={cn(
            "mr-2 h-4 w-4",
            isSelected ? "opacity-100" : "opacity-0",
          )}
        />
        {option.label}
      </>
    ),
    [],
  );

  const defaultRenderTrigger = React.useCallback(
    (selectedOption: ComboboxDrawerOption<T> | undefined) => (
      <>
        {selectedOption ? selectedOption.label : placeholder}
        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
      </>
    ),
    [placeholder],
  );

  const renderOptionContent = renderOption || defaultRenderOption;
  const renderTriggerContent = renderTrigger || defaultRenderTrigger;

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            className={cn("w-full justify-between", className)}
            disabled={disabled}
          >
            {renderTriggerContent(selectedOption)}
          </Button>
        </DrawerTrigger>
        <DrawerContent className="max-h-[80vh] pb-16">
          <DrawerHeader>
            <DrawerTitle>{title || placeholder}</DrawerTitle>
          </DrawerHeader>
          <div className="px-4 pb-4 overflow-y-auto">
            <div className="space-y-2">
              {options.map((option) => {
                const isSelected = option.value === value;
                return (
                  <DrawerClose asChild key={String(option.value)}>
                    <Button
                      variant="ghost"
                      className="w-full text-lg justify-start h-auto p-3 text-left"
                      onClick={() => handleSelect(option.value)}
                    >
                      {renderOptionContent(option, isSelected)}
                    </Button>
                  </DrawerClose>
                );
              })}
            </div>
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between", className)}
          disabled={disabled}
        >
          {renderTriggerContent(selectedOption)}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput placeholder={searchPlaceholder} />
          <CommandList>
            <CommandEmpty>{emptyMessage}</CommandEmpty>
            <CommandGroup>
              {options.map((option) => {
                const isSelected = option.value === value;
                return (
                  <CommandItem
                    key={String(option.value)}
                    value={option.label}
                    onSelect={() => handleSelect(option.value)}
                  >
                    {renderOptionContent(option, isSelected)}
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
