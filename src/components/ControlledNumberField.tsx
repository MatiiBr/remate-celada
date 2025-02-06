import { Controller } from "react-hook-form";

interface Props {
  label?: React.ReactNode | string;
  name: string;
  placeholder?: string;
  control: any;
  inputClassName?: string;
  className?: string;
}

export const ControlledNumberField = ({
  control,
  label,
  name,
  placeholder,
  className,
  inputClassName,
}: Props) => {
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
                type="number"
                placeholder={placeholder}
                min={1}
                className={`w-full px-4 py-2 border bg-white border-neutral-200 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 ${inputClassName}`}
              />
              {error && <p className="text-red-500 text-sm">{error.message}</p>}
            </>
          )}
        />
      </div>
    </div>
  );
};
