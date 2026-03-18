import { Loader2 } from "lucide-react";
import { useState } from "react";
import useLoading from "@/hooks/useLoading";
import useNavigateTo from "@/hooks/useNavigateTo";
import { useTranslate } from "@/utils/i18n";
import { useMutation } from '@tanstack/react-query';
import { useAuthStore } from '@/store/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';

const PasswordSignInForm = () => {
  const t = useTranslate();
  const navigateTo = useNavigateTo();
  const { setToken } = useAuthStore()
  const actionBtnLoadingState = useLoading(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);

  const loginMutation = useMutation({
    mutationFn: async (credentials: { email: string; password: string }) => {
      const response = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });
      if (!response.ok) {
        throw new Error('Login failed');
      }
      const data = await response.json();
      return data.data;
    },
    onSuccess: (data) => {
      setToken(data)
      navigateTo("/");
    },
    onError: (error: Error) => {
      // toast.error(error.message || "Failed to sign in.");
    },
  });

  const handleUsernameInputChanged = (
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
    handleSignInButtonClick();
  };

  const handleSignInButtonClick = async () => {
    if (email === "" || password === "") {
      return;
    }

    if (actionBtnLoadingState.isLoading) {
      return;
    }

    try {
      actionBtnLoadingState.setLoading();
      await loginMutation.mutateAsync({ email, password });
    } catch (error: any) {
      // toast.error(error.message || "Failed to sign in.");
    } finally {
      actionBtnLoadingState.setFinish();
    }
  };

  return (
    <form className="w-full mt-2" onSubmit={handleFormSubmit}>
      <div className="space-y-4 w-full">
        <div className="w-full space-y-2">
          <Label htmlFor="email" className="text-sm text-muted-foreground">
            {t("common.email")}
          </Label>
          <Input
            id="email"
            type="email"
            readOnly={actionBtnLoadingState.isLoading}
            placeholder={t("common.email")}
            value={email}
            autoComplete="email"
            autoCapitalize="off"
            spellCheck={false}
            onChange={handleUsernameInputChanged}
            required
            className="bg-background"
          />
        </div>
        <div className="w-full space-y-2">
          <Label htmlFor="password" className="text-sm text-muted-foreground">
            {t("common.password")}
          </Label>
          <Input
            id="password"
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

      <div className="flex items-center gap-2 w-full mt-6">
        <Checkbox
          id="remember"
          checked={remember}
          onCheckedChange={(checked) => setRemember(!!checked)}
        />
        <Label
          htmlFor="remember"
          className="text-sm font-normal cursor-pointer"
        >
          {t("common.remember-me")}
        </Label>
      </div>

      <div className="flex justify-end items-center w-full mt-6">
        <Button
          type="submit"
          size="lg"
          className="w-full"
          disabled={actionBtnLoadingState.isLoading}
        >
          {actionBtnLoadingState.isLoading && (
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          )}
          {t("common.sign-in")}
        </Button>
      </div>
    </form>
  );
};

export default PasswordSignInForm;