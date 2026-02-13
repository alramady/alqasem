import { useAuth } from "@/_core/hooks/useAuth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
// Login is now handled via /login route
import { useIsMobile } from "@/hooks/useMobile";
import {
  LayoutDashboard,
  MapPin,
  Users,
  Building2,
  CalendarRange,
  Download,
  Settings,
  LogOut,
  PanelLeft,
  TrendingUp,
  Bell,
  KeyRound,
} from "lucide-react";
import { CSSProperties, useEffect, useRef, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useLocation } from "wouter";
import { DashboardLayoutSkeleton } from "./DashboardLayoutSkeleton";


const baseMenuItems = [
  { icon: LayoutDashboard, label: "Market Overview", path: "/" },
  { icon: Building2, label: "Listings", path: "/listings" },
  { icon: Users, label: "Competitors", path: "/competitors" },
  { icon: CalendarRange, label: "Seasonal Patterns", path: "/seasonal" },
  { icon: Download, label: "Export Data", path: "/export", minRole: "user" as const },
  { icon: Settings, label: "Admin Panel", path: "/admin", minRole: "admin" as const },
  { icon: KeyRound, label: "Settings", path: "/settings" },
];

function getMenuItems(role?: string) {
  return baseMenuItems.filter(item => {
    if (!item.minRole) return true;
    if (item.minRole === "admin") return role === "admin";
    if (item.minRole === "user") return role === "user" || role === "admin";
    return true;
  });
}

const SIDEBAR_WIDTH_KEY = "sidebar-width";
const DEFAULT_WIDTH = 260;
const MIN_WIDTH = 200;
const MAX_WIDTH = 480;

export default function DashboardLayout({
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
    // RequireAuth in App.tsx handles redirect to /login
    return <DashboardLayoutSkeleton />;
  }

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": `${sidebarWidth}px`,
        } as CSSProperties
      }
    >
      <DashboardLayoutContent setSidebarWidth={setSidebarWidth}>
        {children}
      </DashboardLayoutContent>
    </SidebarProvider>
  );
}

type DashboardLayoutContentProps = {
  children: React.ReactNode;
  setSidebarWidth: (width: number) => void;
};

function DashboardLayoutContent({
  children,
  setSidebarWidth,
}: DashboardLayoutContentProps) {
  const { user, logout } = useAuth();
  const [location, setLocation] = useLocation();
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === "collapsed";
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const menuItems = getMenuItems(user?.role);
  const activeMenuItem = menuItems.find((item) => item.path === location);
  const isMobile = useIsMobile();

  // Notification bell
  const { data: unreadData } = trpc.notifications.unreadCount.useQuery(undefined, {
    refetchInterval: 30000, // poll every 30s
  });
  const { data: notifList, refetch: refetchNotifs } = trpc.notifications.list.useQuery({ limit: 20 });
  const markAllRead = trpc.notifications.markAllRead.useMutation({
    onSuccess: () => { refetchNotifs(); },
  });
  const unreadCount = unreadData?.count || 0;

  useEffect(() => {
    if (isCollapsed) {
      setIsResizing(false);
    }
  }, [isCollapsed]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      const sidebarLeft =
        sidebarRef.current?.getBoundingClientRect().left ?? 0;
      const newWidth = e.clientX - sidebarLeft;
      if (newWidth >= MIN_WIDTH && newWidth <= MAX_WIDTH) {
        setSidebarWidth(newWidth);
      }
    };
    const handleMouseUp = () => setIsResizing(false);
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

  return (
    <>
      <div className="relative" ref={sidebarRef}>
        <Sidebar
          collapsible="icon"
          className="border-r-0"
          disableTransition={isResizing}
        >
          <SidebarHeader className="h-16 justify-center">
            <div className="flex items-center gap-3 px-2 transition-all w-full">
              <button
                onClick={toggleSidebar}
                className="h-8 w-8 flex items-center justify-center hover:bg-accent rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring shrink-0"
                aria-label="Toggle navigation"
              >
                <PanelLeft className="h-4 w-4 text-muted-foreground" />
              </button>
              {!isCollapsed ? (
                <div className="flex items-center gap-2 min-w-0">
                  <TrendingUp className="h-5 w-5 text-primary shrink-0" />
                  <span className="font-semibold tracking-tight truncate text-sm">
                    CoBNB Market Intelligence
                  </span>
                </div>
              ) : null}
            </div>
          </SidebarHeader>

          <SidebarContent className="gap-0">
            <SidebarMenu className="px-2 py-1">
              {menuItems.map((item) => {
                const isActive =
                  location === item.path ||
                  (item.path !== "/" && location.startsWith(item.path));
                return (
                  <SidebarMenuItem key={item.path}>
                    <SidebarMenuButton
                      isActive={isActive}
                      onClick={() => setLocation(item.path)}
                      tooltip={item.label}
                      className="h-10 transition-all font-normal"
                    >
                      <item.icon
                        className={`h-4 w-4 ${isActive ? "text-primary" : ""}`}
                      />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarContent>

          <SidebarFooter className="p-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-3 rounded-lg px-1 py-1 hover:bg-accent/50 transition-colors w-full text-left group-data-[collapsible=icon]:justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  <Avatar className="h-9 w-9 border shrink-0">
                    <AvatarFallback className="text-xs font-medium bg-primary/10 text-primary">
                      {(user?.displayName || user?.name || "U")?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0 group-data-[collapsible=icon]:hidden">
                    <p className="text-sm font-medium truncate leading-none">
                      {user?.displayName || user?.name || "-"}
                    </p>
                    <p className="text-xs text-muted-foreground truncate mt-1.5">
                      {user?.role === "admin" ? "Administrator" : user?.role === "user" ? "Analyst" : "Viewer"}
                    </p>
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem
                  onClick={() => setLocation("/settings")}
                  className="cursor-pointer"
                >
                  <KeyRound className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={logout}
                  className="cursor-pointer text-destructive focus:text-destructive"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sign out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarFooter>
        </Sidebar>
        <div
          className={`absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-primary/20 transition-colors ${isCollapsed ? "hidden" : ""}`}
          onMouseDown={() => {
            if (isCollapsed) return;
            setIsResizing(true);
          }}
          style={{ zIndex: 50 }}
        />
      </div>

      <SidebarInset>
        {isMobile && (
          <div className="flex border-b h-14 items-center justify-between bg-background/95 px-2 backdrop-blur supports-[backdrop-filter]:backdrop-blur sticky top-0 z-40">
            <div className="flex items-center gap-2">
              <SidebarTrigger className="h-9 w-9 rounded-lg bg-background" />
              <div className="flex items-center gap-3">
                <div className="flex flex-col gap-1">
                  <span className="tracking-tight text-foreground">
                    {activeMenuItem?.label ?? "Menu"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
        {/* Top bar with notification bell */}
        <div className="flex items-center justify-end gap-2 px-4 pt-3 md:px-6 md:pt-4">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="relative h-9 w-9">
                <Bell className="h-4 w-4" />
                {unreadCount > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-5 min-w-5 px-1 text-[10px] bg-primary text-primary-foreground">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-80 p-0">
              <div className="flex items-center justify-between px-4 py-3 border-b">
                <span className="font-semibold text-sm">Notifications</span>
                {unreadCount > 0 && (
                  <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => markAllRead.mutate()}>
                    Mark all read
                  </Button>
                )}
              </div>
              <ScrollArea className="max-h-80">
                {notifList && notifList.length > 0 ? (
                  <div className="divide-y">
                    {notifList.map((n: any) => (
                      <div key={n.id} className={`px-4 py-3 text-sm ${!n.read ? 'bg-primary/5' : ''}`}>
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`h-2 w-2 rounded-full shrink-0 ${
                            n.type === 'error' ? 'bg-red-500' :
                            n.type === 'warning' ? 'bg-yellow-500' :
                            n.type === 'success' ? 'bg-green-500' : 'bg-blue-500'
                          }`} />
                          <span className="font-medium truncate">{n.title}</span>
                        </div>
                        <p className="text-muted-foreground text-xs leading-relaxed">{n.message}</p>
                        <p className="text-muted-foreground/60 text-[10px] mt-1">
                          {new Date(n.timestamp).toLocaleString()}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="px-4 py-8 text-center text-muted-foreground text-sm">
                    No notifications yet
                  </div>
                )}
              </ScrollArea>
            </PopoverContent>
          </Popover>
        </div>
        <main className="flex-1 p-4 md:p-6 pt-2 md:pt-2">{children}</main>
      </SidebarInset>
    </>
  );
}
