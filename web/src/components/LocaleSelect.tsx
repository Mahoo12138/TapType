import { type FC } from "react";
import { GlobeIcon } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { locales } from "@/i18n";
import type { Locale } from '@shared/typings';
import { cn } from "@/lib/utils";

interface Props {
  value: Locale;
  className?: string;
  onChange: (locale: Locale) => void;
}


const LocaleSelect: FC<Props> = ({ onChange, value, className }) => {
  const handleSelectChange = (newValue: Locale | null) => {
    if (newValue) onChange(newValue);
  };

  const getLanguageName = (locale: string) => {
    try {
      const languageName = new Intl.DisplayNames([locale], {
        type: "language",
      }).of(locale);
      return languageName
        ? languageName.charAt(0).toUpperCase() + languageName.slice(1)
        : locale;
    } catch {
      return locale;
    }
  };

  return (
    <Select
      value={value}
      onValueChange={handleSelectChange}
    >
      <SelectTrigger className={cn("w-45", className)}>
        <div className="flex items-center gap-2">
            <GlobeIcon className="size-4" />
            <span>{getLanguageName(value)}</span>
        </div>
      </SelectTrigger>
      <SelectContent>
        {locales.map((locale) => {
          return (
            <SelectItem key={locale} value={locale}>
              {getLanguageName(locale)}
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
};

export default LocaleSelect;
