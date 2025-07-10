import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { logout } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { DataService } from "@/services/data-service";
import { 
  GraduationCap, 
  Home, 
  MessageCircle,
  Settings
} from "lucide-react";
import SettingsModal from "./SettingsModal";
import { useState } from "react";

interface SidebarLayoutProps {
  user: any;
  onLogout: () => void;
  children: React.ReactNode;
  onGoHome?: () => void;
}

export default function SidebarLayout({ user, onLogout, children, onGoHome }: SidebarLayoutProps) {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const { toast } = useToast();

  const { data: chatSessions } = useQuery({
    queryKey: ["chat-sessions", user?.id],
    queryFn: () => DataService.getChatSessions(user?.id),
    enabled: !!user?.id,
  });

  const handleLogout = async () => {
    try {
      if (!user.isAdmin) {
        await logout();
      }
      onLogout();
    } catch (error) {
      toast({
        title: "Đăng xuất thất bại",
        description: "Vui lòng thử lại",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen flex bg-gray-50 dark:bg-gray-900">
      {/* Sidebar */}
      <aside className="w-64 bg-white dark:bg-gray-800 shadow-lg border-r border-gray-200 dark:border-gray-700 flex flex-col">
        {/* Logo */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="bg-primary rounded-xl p-2 w-10 h-10 flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-gray-900 dark:text-white">AI Học tập</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">Học thông minh</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4">
          <Button 
            variant="ghost" 
            className="w-full justify-start text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 mb-4"
            onClick={onGoHome}
          >
            <Home className="w-4 h-4 mr-3 text-primary" />
            Trang chủ
          </Button>

          <Separator className="my-4" />

          {/* Chat History */}
          <div>
            <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-3 px-3">
              Lịch sử chat gần đây
            </h3>
            <ScrollArea className="h-[350px]">
              <div className="space-y-1">
                {chatSessions?.sessions?.map((session: any) => (
                  <Button 
                    key={session.id} 
                    variant="ghost"
                    className="w-full justify-start text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <MessageCircle className="w-3 h-3 mr-2 text-blue-500 flex-shrink-0" />
                    <span className="truncate">{session.title}</span>
                  </Button>
                ))}
                {(!chatSessions?.sessions || chatSessions.sessions.length === 0) && (
                  <p className="px-3 py-2 text-sm text-gray-500 dark:text-gray-500">
                    Chưa có lịch sử chat
                  </p>
                )}
              </div>
            </ScrollArea>
          </div>
        </nav>

        {/* User Section */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3 mb-3">
            <Avatar className="w-8 h-8">
              <AvatarImage src={user?.photoURL || ""} alt={user?.displayName || ""} />
              <AvatarFallback>{user?.displayName?.[0] || user?.email?.[0] || "U"}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="text-sm font-medium text-gray-900 dark:text-white truncate">{user?.email}</div>
              <div className="text-xs text-gray-600 dark:text-gray-400">
                {user.isAdmin ? "Admin" : "Học sinh"}
              </div>
            </div>
          </div>
          <Button 
            variant="ghost" 
            className="w-full justify-start text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            onClick={() => setIsSettingsOpen(true)}
          >
            <Settings className="w-4 h-4 mr-3 text-primary" />
            Cài đặt
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>

      {/* Settings Modal */}
      {isSettingsOpen && (
        <SettingsModal 
          onClose={() => setIsSettingsOpen(false)}
          user={user}
          onLogout={handleLogout}
        />
      )}
    </div>
  );
}