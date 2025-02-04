import { Controller } from "react-hook-form";
import Select from "react-select";

export type Option = {
  label: string;
  value: string;
};

interface Props {
  control: any;
  name: string;
  options: Option[];
  label?: string;
  placeholder?: string;
}

export const ControlledSearchSelectField = ({
  control,
  name,
  label,
  options,
  placeholder,
}: Props) => {
  return (
    <div>
      {label && <label className="block text-black font-medium">{label}</label>}
      <Controller
        name={name}
        control={control}
        render={({ field }) => (
          <Select
            {...field}
            options={options}
            placeholder={placeholder || "Selecciona una opcion"}
            isSearchable
            className="w-full text-black"
            styles={{
              control: (base, state) => ({
                ...base,
                minHeight: 42,
                minWidth: 100,
                borderRadius: "var(--radius-md)",
                borderColor: "var(--color-neutral-200)",
                boxShadow: state.isFocused
                  ? "0 0 0 2px var(--color-red-500)"
                  : "none",
                "&:hover": {
                  borderColor: "var(--color-neutral-200)",
                  boxShadow: "0 0 0 2px var(--color-red-500)",
                },
              }),
            }}
            theme={(theme) => ({
              ...theme,
              colors: {
                ...theme.colors,
                primary: "var(--color-red-500)",
                primary25: "var(--color-red-200)",
              },
            })}
          />
        )}
      />
    </div>
  );
};
