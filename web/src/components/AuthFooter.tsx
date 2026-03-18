// import { workspaceStore } from "@/store/workspace";
import type { Appearance, Locale } from '@shared/typings';
import AppearanceSelect from "./AppearanceSelect";
import LocaleSelect from "./LocaleSelect";
import { useGlobalStore } from "@/store/global";
import { cn } from "@/lib/utils";

interface Props {
  className?: string;
}
const AuthFooter = ({ className }: Props) => {
  const { locale, appearance, setLocale, setAppearance } = useGlobalStore();
  const handleLocaleSelectChange = (locale: Locale) => {
    setLocale(locale);
  };

  const handleAppearanceSelectChange = (appearance: Appearance) => {
    setAppearance(appearance);
  };

  return (
    <div
      className={cn(
        "mx-auto mt-4 mb-2 flex w-[320px] max-w-full justify-center",
        className
      )}
    >
      <div className="flex w-full flex-row items-center justify-center gap-4">
        <LocaleSelect value={locale} onChange={handleLocaleSelectChange} />
        <AppearanceSelect
          value={appearance}
          onChange={handleAppearanceSelectChange}
        />
      </div>
    </div>
  );
};

export default AuthFooter;
