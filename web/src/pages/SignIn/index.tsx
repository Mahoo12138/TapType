import AuthFooter from '@/components/AuthFooter';
import PasswordSignInForm from '@/components/PasswordSignInForm';
import { useTranslate } from "@/utils/i18n";
import { Link } from '@tanstack/react-router';

const SignIn = () => {
  const t = useTranslate();

  return (
    <div className="py-4 sm:py-8 w-80 max-w-full min-h-svh mx-auto flex flex-col justify-start items-center">
      <div className="w-full py-4 grow flex flex-col justify-center items-center">
        <div className="w-full flex flex-row justify-center items-center mb-6">
          <img
            className="h-14 w-auto"
            src="/logo.webp"
            alt=""
          />
          <h1 className="pb-2 ml-2 text-[40px] text-foreground/80 font-bold">
            Qwerty
          </h1>
        </div>
        <PasswordSignInForm />
        <p className="w-full mt-4 text-sm">
          <span className="text-muted-foreground">{t("auth.sign-up-tip")}</span>
          <Link
            to="/auth/sign-up"
            className="cursor-pointer ml-2 text-blue-600 underline hover:text-blue-700"
            viewTransition
          >
            {t("common.sign-up")}
          </Link>
        </p>
      </div>
      <AuthFooter />
    </div>
  );
};

export default SignIn;