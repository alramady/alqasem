import { useAuth } from "@/_core/hooks/useAuth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { useIsMobile } from "@/hooks/useMobile";
import { trpc } from "@/lib/trpc";
import {
  LayoutDashboard,
  LogOut,
  Users,
  Building2,
  FolderKanban,
  MessageSquare,
  FileText,
  Image,
  BarChart3,
  Settings,
  ScrollText,
  PanelRight,
  Bell,
  Mail,
  BookOpen,
  Shield,
  ChevronDown,
  UserCircle,
  Search,
  Moon,
  Sun,
  Maximize,
  ExternalLink,
  Monitor,
} from "lucide-react";
import { CSSProperties, useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { DashboardLayoutSkeleton } from "./DashboardLayoutSkeleton";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";

type MenuGroup = {
  label: string;
  items: { icon: any; label: string; path: string; badge?: string }[];
};

const menuGroups: MenuGroup[] = [
  {
    label: "الرئيسية",
    items: [
      { icon: LayoutDashboard, label: "لوحة المعلومات", path: "/admin/dashboard" },
    ],
  },
  {
    label: "إدارة المحتوى",
    items: [
      { icon: Building2, label: "العقارات", path: "/admin/properties" },
      { icon: FolderKanban, label: "المشاريع", path: "/admin/projects" },
      { icon: FileText, label: "الصفحات", path: "/admin/cms" },
      { icon: Image, label: "مكتبة الوسائط", path: "/admin/media" },
    ],
  },
  {
    label: "التواصل",
    items: [
      { icon: MessageSquare, label: "الطلبات", path: "/admin/inquiries" },
      { icon: Bell, label: "التنبيهات", path: "/admin/notifications" },
      { icon: Mail, label: "المراسلات", path: "/admin/messages" },
    ],
  },
  {
    label: "الإدارة",
    items: [
      { icon: Users, label: "المستخدمون", path: "/admin/users" },
      { icon: Monitor, label: "الجلسات", path: "/admin/sessions" },
      { icon: Shield, label: "الصلاحيات", path: "/admin/permissions" },
      { icon: BarChart3, label: "التقارير", path: "/admin/reports" },
      { icon: Settings, label: "الإعدادات", path: "/admin/settings" },
      { icon: ScrollText, label: "سجل النشاطات", path: "/admin/audit-log" },
      { icon: BookOpen, label: "أدلة الاستخدام", path: "/admin/guides" },
    ],
  },
];

const SIDEBAR_WIDTH_KEY = "admin-sidebar-width";
const DEFAULT_WIDTH = 260;
const MIN_WIDTH = 220;
const MAX_WIDTH = 360;

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const saved = localStorage.getItem(SIDEBAR_WIDTH_KEY);
    return saved ? parseInt(saved, 10) : DEFAULT_WIDTH;
  });
  const { loading, user } = useAuth();

  useEffect(() => {
    localStorage.setItem(SIDEBAR_WIDTH_KEY, sidebarWidth.toString());
  }, [sidebarWidth]);

  if (loading) {
    return <DashboardLayoutSkeleton />;
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-slate-100" dir="rtl">
        <div className="flex flex-col items-center gap-8 p-10 max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-100">
          <div className="flex flex-col items-center gap-4">
            <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-2xl flex items-center justify-center shadow-lg">
              <Building2 className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-slate-800 text-center">
              لوحة تحكم القاسم العقارية
            </h1>
            <p className="text-sm text-slate-500 text-center max-w-sm">
              يرجى تسجيل الدخول للوصول إلى لوحة التحكم
            </p>
          </div>
          <Button
            onClick={() => {
              window.location.href = "/admin/login";
            }}
            size="lg"
            className="w-full bg-gradient-to-r from-indigo-500 to-violet-600 text-white hover:from-indigo-600 hover:to-violet-700 font-bold shadow-lg text-base h-12 rounded-xl"
          >
            تسجيل الدخول
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div dir="rtl">
      <SidebarProvider
        style={
          {
            "--sidebar-width": `${sidebarWidth}px`,
          } as CSSProperties
        }
      >
        <AdminLayoutContent setSidebarWidth={setSidebarWidth}>
          {children}
        </AdminLayoutContent>
      </SidebarProvider>
    </div>
  );
}

type AdminLayoutContentProps = {
  children: React.ReactNode;
  setSidebarWidth: (width: number) => void;
};

function AdminLayoutContent({
  children,
  setSidebarWidth,
}: AdminLayoutContentProps) {
  const { user, logout } = useAuth();
  const [location, setLocation] = useLocation();
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === "collapsed";
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();

  // Fetch notification and message counts
  const { data: notifCount } = trpc.admin.unreadNotificationCount.useQuery(undefined, { refetchInterval: 30000 });
  const { data: msgCount } = trpc.admin.unreadMessageCount.useQuery(undefined, { refetchInterval: 30000 });

  const allItems = menuGroups.flatMap(g => g.items);
  const activeMenuItem = allItems.find(
    (item) => location === item.path || (item.path === "/admin/dashboard" && location === "/admin")
  );

  useEffect(() => {
    if (isCollapsed) {
      setIsResizing(false);
    }
  }, [isCollapsed]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      const sidebarRight =
        sidebarRef.current?.getBoundingClientRect().right ?? 0;
      const newWidth = sidebarRight - e.clientX;
      if (newWidth >= MIN_WIDTH && newWidth <= MAX_WIDTH) {
        setSidebarWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isResizing, setSidebarWidth]);

  const getBadge = (path: string) => {
    if (path === "/admin/notifications" && notifCount?.count) return notifCount.count;
    if (path === "/admin/messages" && msgCount?.count) return msgCount.count;
    return 0;
  };

  return (
    <>
      <div className="relative" ref={sidebarRef}>
        <Sidebar
          collapsible="icon"
          className="border-l border-slate-200/80 bg-white"
          disableTransition={isResizing}
          side="right"
        >
          {/* Sidebar Header - Logo */}
          <SidebarHeader className="h-16 justify-center bg-white border-b border-slate-100">
            <div className="flex items-center gap-3 px-2 transition-all w-full">
              <div className="h-9 w-9 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl flex items-center justify-center shrink-0 shadow-sm">
                <Building2 className="h-5 w-5 text-white" />
              </div>
              {!isCollapsed && (
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <span className="font-bold text-slate-800 truncate text-sm">
                    القاسم العقارية
                  </span>
                </div>
              )}
              <button
                onClick={toggleSidebar}
                className="h-8 w-8 flex items-center justify-center hover:bg-slate-100 rounded-lg transition-colors focus:outline-none shrink-0"
                aria-label="طي القائمة"
              >
                <PanelRight className="h-4 w-4 text-slate-400" />
              </button>
            </div>
          </SidebarHeader>

          {/* Sidebar Navigation */}
          <SidebarContent className="gap-0 bg-white overflow-y-auto py-2">
            {menuGroups.map((group, gi) => (
              <div key={gi} className="px-3 py-1">
                {!isCollapsed && (
                  <div className="px-2 py-2.5 text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em]">
                    {group.label}
                  </div>
                )}
                {isCollapsed && gi > 0 && (
                  <div className="my-2 border-t border-slate-100" />
                )}
                <SidebarMenu>
                  {group.items.map((item) => {
                    const isActive =
                      location === item.path ||
                      (item.path === "/admin/dashboard" && location === "/admin");
                    const badgeCount = getBadge(item.path);
                    return (
                      <SidebarMenuItem key={item.path}>
                        <SidebarMenuButton
                          isActive={isActive}
                          onClick={() => setLocation(item.path)}
                          tooltip={item.label}
                          className={`h-10 rounded-lg transition-all font-normal text-slate-600 hover:text-slate-900 hover:bg-slate-50 ${
                            isActive
                              ? "!bg-indigo-50 !text-indigo-600 font-semibold"
                              : ""
                          }`}
                        >
                          <div className="relative">
                            <item.icon
                              className={`h-[18px] w-[18px] ${
                                isActive ? "text-indigo-500" : "text-slate-400"
                              }`}
                            />
                            {badgeCount > 0 && isCollapsed && (
                              <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                                {badgeCount > 9 ? "9+" : badgeCount}
                              </span>
                            )}
                          </div>
                          <span className="text-[13px]">
                            {item.label}
                          </span>
                          {badgeCount > 0 && !isCollapsed && (
                            <Badge className="mr-auto text-[10px] h-5 px-1.5 rounded-full bg-red-500 text-white hover:bg-red-500">
                              {badgeCount}
                            </Badge>
                          )}
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </div>
            ))}
          </SidebarContent>

          {/* Sidebar Footer - User */}
          <SidebarFooter className="p-3 bg-white border-t border-slate-100">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-3 rounded-xl px-2 py-2 hover:bg-slate-50 transition-colors w-full text-right group-data-[collapsible=icon]:justify-center focus:outline-none">
                  <Avatar className="h-9 w-9 border-2 border-indigo-100 shrink-0">
                    <AvatarFallback className="text-xs font-bold bg-gradient-to-br from-indigo-500 to-violet-600 text-white">
                      {user?.name?.charAt(0).toUpperCase() || "م"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0 group-data-[collapsible=icon]:hidden">
                    <p className="text-sm font-semibold truncate leading-none text-slate-800">
                      {user?.name || "مستخدم"}
                    </p>
                    <p className="text-xs text-slate-400 truncate mt-1.5">
                      {user?.role === "admin" ? "مدير النظام" : user?.role === "manager" ? "مدير" : "موظف"}
                    </p>
                  </div>
                  <ChevronDown className="h-3.5 w-3.5 text-slate-300 group-data-[collapsible=icon]:hidden" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 rounded-xl shadow-lg border-slate-200">
                <div className="px-3 py-2.5">
                  <p className="text-sm font-semibold text-slate-800">{user?.name || "مستخدم"}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{user?.email || "-"}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => setLocation("/admin/profile")}
                  className="cursor-pointer rounded-lg mx-1"
                >
                  <UserCircle className="ml-2 h-4 w-4 text-slate-400" />
                  <span>الملف الشخصي</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setLocation("/")}
                  className="cursor-pointer rounded-lg mx-1"
                >
                  <ExternalLink className="ml-2 h-4 w-4 text-slate-400" />
                  <span>الموقع الرئيسي</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setLocation("/admin/settings")}
                  className="cursor-pointer rounded-lg mx-1"
                >
                  <Settings className="ml-2 h-4 w-4 text-slate-400" />
                  <span>الإعدادات</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={logout}
                  className="cursor-pointer text-red-500 focus:text-red-500 rounded-lg mx-1"
                >
                  <LogOut className="ml-2 h-4 w-4" />
                  <span>تسجيل الخروج</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarFooter>
        </Sidebar>

        {/* Resize handle */}
        <div
          className={`absolute top-0 left-0 w-1 h-full cursor-col-resize hover:bg-indigo-200 transition-colors ${
            isCollapsed ? "hidden" : ""
          }`}
          onMouseDown={() => {
            if (isCollapsed) return;
            setIsResizing(true);
          }}
          style={{ zIndex: 50 }}
        />
      </div>

      <SidebarInset>
        {/* Top Header Bar */}
        <header className="flex border-b border-slate-200/80 h-16 items-center justify-between bg-white px-4 lg:px-6 sticky top-0 z-40 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          <div className="flex items-center gap-3">
            {isMobile && (
              <SidebarTrigger className="h-9 w-9 rounded-lg" />
            )}
            {/* Breadcrumb / Page title */}
            <div className="flex items-center gap-2">
              <h1 className="text-base font-semibold text-slate-800">
                {activeMenuItem?.label ?? "لوحة التحكم"}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {/* Search button */}
            <button className="h-9 w-9 flex items-center justify-center hover:bg-slate-100 rounded-xl transition-colors text-slate-400 hover:text-slate-600">
              <Search className="h-[18px] w-[18px]" />
            </button>

            {/* Notifications */}
            <button
              onClick={() => setLocation("/admin/notifications")}
              className="relative h-9 w-9 flex items-center justify-center hover:bg-slate-100 rounded-xl transition-colors text-slate-400 hover:text-slate-600"
            >
              <Bell className="h-[18px] w-[18px]" />
              {(notifCount?.count ?? 0) > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white" />
              )}
            </button>

            {/* Messages */}
            <button
              onClick={() => setLocation("/admin/messages")}
              className="relative h-9 w-9 flex items-center justify-center hover:bg-slate-100 rounded-xl transition-colors text-slate-400 hover:text-slate-600"
            >
              <Mail className="h-[18px] w-[18px]" />
              {(msgCount?.count ?? 0) > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-indigo-500 rounded-full ring-2 ring-white" />
              )}
            </button>

            {/* Divider */}
            <div className="w-px h-6 bg-slate-200 mx-2" />

            {/* User avatar in header */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 hover:bg-slate-50 rounded-xl px-2 py-1.5 transition-colors focus:outline-none">
                  <Avatar className="h-8 w-8 border-2 border-indigo-100">
                    <AvatarFallback className="text-xs font-bold bg-gradient-to-br from-indigo-500 to-violet-600 text-white">
                      {user?.name?.charAt(0).toUpperCase() || "م"}
                    </AvatarFallback>
                  </Avatar>
                  {!isMobile && (
                    <div className="text-right">
                      <p className="text-xs font-semibold text-slate-700 leading-none">{user?.name || "مستخدم"}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        {user?.role === "admin" ? "مدير" : user?.role === "manager" ? "مدير" : "موظف"}
                      </p>
                    </div>
                  )}
                  <ChevronDown className="h-3 w-3 text-slate-300" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 rounded-xl shadow-lg border-slate-200">
                <div className="px-3 py-2.5">
                  <p className="text-sm font-semibold text-slate-800">{user?.name || "مستخدم"}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{user?.email || "-"}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setLocation("/admin/profile")} className="cursor-pointer rounded-lg mx-1">
                  <UserCircle className="ml-2 h-4 w-4 text-slate-400" />
                  <span>الملف الشخصي</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setLocation("/")} className="cursor-pointer rounded-lg mx-1">
                  <ExternalLink className="ml-2 h-4 w-4 text-slate-400" />
                  <span>الموقع الرئيسي</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout} className="cursor-pointer text-red-500 focus:text-red-500 rounded-lg mx-1">
                  <LogOut className="ml-2 h-4 w-4" />
                  <span>تسجيل الخروج</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 p-4 lg:p-6 bg-slate-50/80 min-h-[calc(100vh-4rem)]">
          {children}
        </main>
      </SidebarInset>
    </>
  );
}
