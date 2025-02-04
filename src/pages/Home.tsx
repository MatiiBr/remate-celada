import { ContentLayout } from "../components/ContentLayout";
import { Logo } from "../components/Logo";

export const Home = () => {
  return (
    <ContentLayout>
      <div className="h-full w-full flex justify-center items-center">
        <Logo className="min-h-[200px]" />
      </div>
    </ContentLayout>
  );
};
