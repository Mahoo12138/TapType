import logo from "@/assets/logo.svg";
import type { PropsWithChildren } from "react";
import type React from "react";
import { Link as RouterLink } from "@tanstack/react-router";
import { Settings, LogOut, Info } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const Header: React.FC<PropsWithChildren> = ({ children }) => {
  return (
    <header className="py-3 px-4 w-full bg-background">
      <div className="max-w-[1200px] mx-auto w-full">
        <div className="flex flex-row items-center justify-between w-full">
          <RouterLink to="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
            <img
              src={logo}
              style={{ height: '3.5rem', marginRight: 16 }}
              alt="Qwerty Learner Logo"
            />
            <h1 className="text-[32px] text-primary font-bold m-0">
              Qwerty Learner
            </h1>
          </RouterLink>
          <div className="flex flex-row items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger className="outline-none rounded-full cursor-pointer">
                <Avatar className="w-[50px] h-[50px]">
                  <AvatarImage src="https://avatars.githubusercontent.com/u/45908451" alt="User Avatar" />
                  <AvatarFallback>UA</AvatarFallback>
                </Avatar>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-[180px]">
                <DropdownMenuItem asChild>
                  <RouterLink to="/setting" className="cursor-pointer flex items-center w-full">
                    <Settings size={18} style={{ marginRight: 8 }} />设置
                  </RouterLink>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <RouterLink to="/about" className="cursor-pointer flex items-center w-full">
                    <Info size={18} style={{ marginRight: 8 }} />关于
                  </RouterLink>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-red-500 cursor-pointer flex items-center w-full focus:text-red-500 focus:bg-red-50">
                  <LogOut size={18} style={{ marginRight: 8 }} />退出登录
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
