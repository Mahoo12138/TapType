import { SunIcon, MoonIcon, SmileIcon } from "lucide-react";
import type { FC } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import type { Appearance } from '@shared/typings';
import { useTranslate } from "@/utils/i18n";
import { cn } from "@/lib/utils";

interface Props {
  value: Appearance;
  onChange: (appearance: Appearance) => void;
  className?: string;
}

const appearanceList = ["system", "light", "dark"] as const;

const AppearanceSelect: FC<Props> = (props: Props) => {
  const { onChange, value, className } = props;
  const t = useTranslate();

  const getIcon = (appearance: Appearance) => {
    if (appearance === "light") {
      return <SunIcon className="size-4" />;
    } else if (appearance === "dark") {
      return <MoonIcon className="size-4" />;
    } else {
      return <SmileIcon className="size-4" />;
    }
  };

  const handleSelectChange = (newValue: Appearance | null) => {
    if (newValue) {
      onChange(newValue);
    }
  };

  return (
    <Select value={value} onValueChange={handleSelectChange}>
      <SelectTrigger className={cn("w-45", className)}>
        <div className="flex items-center gap-2">
          {getIcon(value)}
          <span>{t(`setting.appearance-option.${value}`)}</span>
        </div>
      </SelectTrigger>
      <SelectContent>
        {appearanceList.map((appearance) => (
          <SelectItem key={appearance} value={appearance}>
            <div className="flex items-center gap-2">
              {getIcon(appearance)}
              <span>{t(`setting.appearance-option.${appearance}`)}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default AppearanceSelect;
