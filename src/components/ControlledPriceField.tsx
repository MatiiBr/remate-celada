import { Controller } from "react-hook-form";
import { useMaskito } from "@maskito/react";

interface Props {
  label?: React.ReactNode | string;
  name: string;
  placeholder?: string;
  control: any;
  inputClassName?: string;
  className?: string;
}

export const ControlledPriceField = ({
  control,
  label,
  name,
  placeholder,
  className,
  inputClassName,
}: Props) => {
  const maskitoOptions = {
    mask: /^[0-9]*([.][0-9]{0,2})?$/,
    format: (value: string) => value.replace(/\./g, "."),
    parse: (value: string) => value.replace(/,/g, "."),
  };

  return (
    <div className={className}>
      {label && <label className="block text-black font-medium">{label}</label>}
      <div className="relative">
        <Controller
          name={name}
          control={control}
          render={({
            field: { value, onChange, onBlur, ref },
            fieldState: { error },
          }) => {
            const maskitoRef = useMaskito({
              options: maskitoOptions,
            });

            return (
              <>
                <input
                  ref={(el) => {
                    ref(el);
                    maskitoRef(el);
                  }}
                  type="text"
                  placeholder={placeholder || "0.00"}
                  value={value ?? ""}
                  onInput={(e) => {
                    const inputValue = (e.target as HTMLInputElement).value;
                    onChange(inputValue);
                  }}
                  onBlur={onBlur}
                  className={`w-full px-4 py-2 border bg-white border-neutral-200 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 ${inputClassName}`}
                />
                {error && (
                  <p className="text-red-500 text-sm">{error.message}</p>
                )}
              </>
            );
          }}
        />
      </div>
    </div>
  );
};
