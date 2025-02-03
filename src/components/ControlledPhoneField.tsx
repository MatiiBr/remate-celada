import { Controller } from "react-hook-form";
import { useMask } from "@react-input/mask";

interface Props {
  label?: React.ReactNode | string;
  name: string;
  placeholder?: string;
  type?: "text" | "email";
  control: any;
  inputClassName?: string;
  className?: string;
}

export const ControlledPhoneField = ({
  control,
  label,
  name,
  placeholder,
  className,
  inputClassName,
  type = "text",
}: Props) => {
  const inputRef = useMask({
    mask: "(___) _______",
    replacement: { _: /\d/ },
  });
  return (
    <div className={className}>
      {label && <label className="block text-black font-medium">{label}</label>}
      <div className="relative">
        <Controller
          name={name}
          control={control}
          render={({ field, fieldState: { error } }) => (
            <>
              <input
                {...field}
                ref={inputRef}
                type={type}
                placeholder={placeholder}
                className={`w-full px-4 py-2 border border-neutral-200 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 ${inputClassName}`}
              />
              {error && <p className="text-red-500 text-sm">{error.message}</p>}
            </>
          )}
        />
      </div>
    </div>
  );
};
