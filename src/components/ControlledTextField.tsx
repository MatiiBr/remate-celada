import { Controller } from "react-hook-form";

interface Props {
  label?: React.ReactNode | string;
  name: string;
  placeholder?: string;
  type?: "text" | "email";
  control: any;
  icon?: React.ReactNode;
  inputClassName?: string;
  className?: string
  onIconClick?: () => void;
}

export const ControlledTextField = ({
  control,
  label,
  name,
  placeholder,
  className,
  inputClassName,
  icon,
  onIconClick,
  type = "text",
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
                type={type}
                placeholder={placeholder}
                className={`w-full px-4 py-2 border border-neutral-200 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 ${inputClassName}`}
              />
              {icon && field.value && (
                <div
                  className="absolute inset-y-0 right-3 flex items-center cursor-pointer text-gray-500 hover:text-gray-700 cursor-pointer"
                  onClick={onIconClick}
                >
                  {icon}
                </div>
              )}
              {error && <p className="text-red-500 text-sm">{error.message}</p>}
            </>
          )}
        />
      </div>
    </div>
  );
};
