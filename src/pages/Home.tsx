import { ContentLayout } from "../components/ContentLayout";
import { Logo } from "../components/Logo";

export const Home = () => {
  return (
    <ContentLayout>
    <div className="min-h-[calc(100vh-60px)] flex justify-center items-center">
      <Logo className="w-auto h-32" />
    </div>
  </ContentLayout>
  );
};
