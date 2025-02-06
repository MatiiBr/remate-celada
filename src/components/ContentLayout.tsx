import { ReactNode } from 'react';

interface Prop {
  children: ReactNode;
}

export const ContentLayout = ({ children }: Prop) => {
  return (
    <div
      className="mx-auto bg-white shadow-md h-full"
      style={{ minHeight: "calc(100vh - 60px)" }}
    >
      {children}
    </div>
  );
};
