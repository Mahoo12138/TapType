import type React from "react";
import { Link } from "@tanstack/react-router";
import Header from "@/components/Header";
import { Book, AlertCircle, BarChart2, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const Home: React.FC = () => {
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "早上好";
    if (hour < 18) return "下午好";
    return "晚上好";
  };

  const menuItems = [
    {
      title: "词库",
      description: "管理你的词库，添加新的单词和短语",
      icon: Book,
      link: "/dictionary",
    },
    {
      title: "错题本",
      description: "查看和复习你经常出错的单词",
      icon: AlertCircle,
      link: "/mistake",
    },
    {
      title: "统计",
      description: "查看你的练习数据和进步情况",
      icon: BarChart2,
      link: "/statistic",
    },
    {
      title: "练习计划",
      description: "制定和跟踪你的练习计划",
      icon: Calendar,
      link: "/plan",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="flex flex-col items-center mt-12">
        <h2 className="text-[40px] font-bold mb-3">
          {getGreeting()}
        </h2>
        <p className="text-lg text-muted-foreground mb-3">
          准备好开始今天的打字练习了吗？
        </p>
        <Button
          asChild
          size="lg"
          className="text-xl px-6 py-2 h-auto rounded-full mb-6"
        >
          <Link to="/typing">开始练习</Link>
        </Button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-[900px] mx-auto mt-2 px-4 sm:px-0">
        {menuItems.map((item) => (
          <div key={item.title}>
            <Card
              className="h-[132px] flex flex-col justify-end transition-shadow duration-300 hover:shadow-lg group bg-muted/50 border-none"
            >
              <CardContent className="flex-grow flex flex-row items-end justify-between p-6">
                <div className="flex flex-col items-start justify-end">
                  <h4 className="text-xl font-bold mb-1 group-hover:text-primary transition-colors">
                    {item.title}
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {item.description}
                  </p>
                </div>
                <Button
                  asChild
                  variant="ghost"
                  className="p-0 min-w-0 h-auto self-end hover:bg-transparent"
                >
                  <Link to={item.link}>
                    <item.icon size={48} className="transition-colors group-hover:text-primary" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Home;
