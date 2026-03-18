import { Loader2 } from "lucide-react";
import { useState } from "react";
import AuthFooter from "@/components/AuthFooter";
import useLoading from "@/hooks/useLoading";
import useNavigateTo from "@/hooks/useNavigateTo";
import { useTranslate } from "@/utils/i18n";
import { useGlobalStore } from '@/store/global';
import { Link } from '@tanstack/react-router';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const SignUp = () => {
  const t = useTranslate();
  const { status } = useGlobalStore();
  const navigateTo = useNavigateTo();
  const actionBtnLoadingState = useLoading(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleEmailInputChanged = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const text = e.target.value as string;
    setEmail(text);
  };

  const handlePasswordInputChanged = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const text = e.target.value as string;
    setPassword(text);
  };

  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    handleSignUpButtonClick();
  };

  const handleSignUpButtonClick = async () => {
    if (email === "" || password === "") {
      return;
    }
    if (actionBtnLoadingState.isLoading) {
      return;
    }
    try {
      actionBtnLoadingState.setLoading();
      // await authServiceClient.signUp({ email, password });
      // await initialUserStore();
      navigateTo("/");
    } catch (error: any) {
      // toast.error((error as ClientError).details || "Sign up failed");
    }
    actionBtnLoadingState.setFinish();
  };

  return (
    <div className="py-4 sm:py-8 w-[320px] max-w-full min-h-svh mx-auto flex flex-col justify-start items-center">
      <div className="w-full py-4 grow flex flex-col justify-center items-center">
        <div className="w-full flex flex-row justify-center items-center mb-6">
          <img
            style={{ height: 56, width: 'auto' }}
            src={"/logo.webp"}
            alt=""
          />
          <h1 className="pb-2 ml-2 text-[40px] text-primary opacity-80">
            {"Qwerty"}
          </h1>
        </div>
        <>
          <h2 className="w-full text-2xl mt-2 text-muted-foreground">
            {t("auth.create-your-account")}
          </h2>
          <form className="w-full mt-2" onSubmit={handleFormSubmit}>
            <div className="flex flex-col gap-2 items-start w-full">
              <div className="w-full">
                <p className="text-sm leading-8 text-muted-foreground">
                  {t("common.email")}
                </p>
                <Input
                  type="email"
                  readOnly={actionBtnLoadingState.isLoading}
                  placeholder={t("common.email")}
                  value={email}
                  autoComplete="email"
                  autoCapitalize="off"
                  spellCheck={false}
                  onChange={handleEmailInputChanged}
                  required
                  className="bg-background"
                />
              </div>
              <div className="w-full">
                <p className="text-sm leading-8 text-muted-foreground">
                  {t("common.password")}
                </p>
                <Input
                  type="password"
                  readOnly={actionBtnLoadingState.isLoading}
                  placeholder={t("common.password")}
                  value={password}
                  autoComplete="password"
                  autoCapitalize="off"
                  spellCheck={false}
                  onChange={handlePasswordInputChanged}
                  required
                  className="bg-background"
                />
              </div>
            </div>
            <div className="flex flex-row justify-end items-center w-full mt-6">
              <Button
                type="submit"
                size="lg"
                className="w-full"
                disabled={actionBtnLoadingState.isLoading}
                onClick={handleSignUpButtonClick}
              >
                {actionBtnLoadingState.isLoading && <Loader2 className="w-5 h-auto mr-2 animate-spin opacity-60" />}
                {t("common.sign-up")}
              </Button>
            </div>
          </form>
        </>
        {!status?.host ? (
          <p className="w-full mt-4 text-sm text-muted-foreground font-medium">
            {t("auth.host-tip")}
          </p>
        ) : (
          <p className="w-full mt-4 text-sm">
            <span className="text-muted-foreground">{t("auth.sign-in-tip")}</span>
            <Link
              to="/auth/sign-in"
              style={{ cursor: 'pointer', marginLeft: 8, color: '#2563eb', textDecoration: 'underline' }}
              viewTransition
            >
              {t("common.sign-in")}
            </Link>
          </p>
        )}
      </div>
      <AuthFooter />
    </div>
  );
};

export default SignUp;
