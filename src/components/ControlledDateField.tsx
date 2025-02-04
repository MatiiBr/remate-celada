import { Controller } from "react-hook-form";

interface Props {
  label?: React.ReactNode | string;
  name: string;
  placeholder?: string;
  control: any;
  inputClassName?: string;
  className?: string;
  maxDate?: string;
  minDate?: string;
  defaultValue?: string;
}

export const ControlledDateField = ({
  control,
  label,
  name,
  placeholder,
  className,
  inputClassName,
  maxDate,
  minDate = new Date().toISOString().split("T")[0],
  defaultValue = new Date().toISOString().split("T")[0]
}: Props) => {
  return (
    <div className={className}>
      {label && <label className="block text-black font-medium">{label}</label>}
      <div className="relative">
        <Controller
          name={name}
          control={control}
          defaultValue={defaultValue}
          render={({ field, fieldState: { error } }) => (
            <>
              <input
                {...field}
                type="date"
                placeholder={placeholder}
                min={minDate}
                max={maxDate}
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
