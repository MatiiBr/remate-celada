import { Controller } from "react-hook-form";

interface Props {
  label?: React.ReactNode | string;
  name: string;
  control: any;
  options: string[];
  placeholder?: string;
}

export const ControlledSelectField = ({
  control,
  label,
  name,
  options,
  placeholder,
}: Props) => {
  return (
    <div>
      {label && <label className="block text-black font-medium">{label}</label>}
      <div className="relative">
        <Controller
          name={name}
          control={control}
          render={({ field, fieldState: { error } }) => (
            <>
              <select
                {...field}
                className="w-full px-4 py-2 border border-neutral-200 rounded-md bg-white text-black focus:outline-none focus:ring-2 focus:ring-red-500 appearance-none"
              >
                <option value="">
                  {placeholder || "Seleccione una opción"}
                </option>
                {options.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              {error && <p className="text-red-500 text-sm">{error.message}</p>}
            </>
          )}
        />
      </div>
    </div>
  );
};
