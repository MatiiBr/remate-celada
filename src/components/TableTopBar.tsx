import { Link } from "react-router-dom";

type Props = {
  name: string;
  buttonLink?: string;
  buttonLabel?: string;
};

export const TableTopBar = ({ name, buttonLink, buttonLabel }: Props) => {
  return (
    <div className="flex p-6 justify-between items-center border-b-2 border-red-700">
      <h1 className="text-2xl font-bold text-red-700">{name}</h1>
      {buttonLink && buttonLabel && (
        <Link
          to={buttonLink}
          className="py-2 px-3 bg-red-700 text-white font-semibold rounded"
        >
          {buttonLabel}
        </Link>
      )}
    </div>
  );
};
