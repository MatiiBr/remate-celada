import { Controller } from "react-hook-form";
import AsyncSelect from "react-select/async";
import { ReactNode, useState } from "react";

export type AsyncOption = {
  value: number;
  label: string;
};

interface Props {
  control: any;
  name: string;
  loadOptions: (inputValue: string) => Promise<AsyncOption[]>;
  label?: string | ReactNode;
  placeholder?: string;
  className?: string;
}

export const ControlledAsyncSearchSelectField = ({
  control,
  name,
  label,
  placeholder,
  className,
  loadOptions,
}: Props) => {
  const [options, setOptions] = useState<AsyncOption[]>([]);
  const [loading, setLoading] = useState(false);

  const handleMenuOpen = async () => {
    if (options.length === 0) {
      // Evita cargar si ya hay datos
      setLoading(true);
      const fetchedOptions = await loadOptions("");
      setOptions(fetchedOptions);
      setLoading(false);
    }
  };

  return (
    <div className={className}>
      {label && <label className="block text-black font-medium">{label}</label>}
      <Controller
        name={name}
        control={control}
        render={({ field }) => (
          <AsyncSelect
            {...field}
            loadOptions={loadOptions}
            cacheOptions
            defaultOptions={options}
            onMenuOpen={handleMenuOpen}
            placeholder={placeholder || "Selecciona una opción"}
            isSearchable
            isLoading={loading}
            className="w-full text-black"
            styles={{
              control: (base, state) => ({
                ...base,
                minHeight: 42,
                borderRadius: "var(--radius-md)",
                borderColor: state.isFocused
                  ? "var(--color-red-500)"
                  : "var(--color-neutral-200)",
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
