// frontend/src/components/layout/Navbar.tsx
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Home, FileText, Users, Briefcase, Search, Bell, LogOut, Code2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { toast } from "@/hooks/use-toast";
import axios from "@/api/axios";
import { useState, useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";

interface NotificationData {
  message: string;
  timestamp: string;
}

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [loggingOut, setLoggingOut] = useState(false);
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  const navItems = [
    { path: "/dashboard", icon: Home, label: "Home" },
    { path: "/blogs", icon: FileText, label: "Blogs" },
    { path: "/network", icon: Users, label: "Network" },
    { path: "/jobs", icon: Briefcase, label: "Jobs" },
    { path: "/collaborate", icon: Code2, label: "Collaborate" },
  ];

  const isActive = (path: string) => location.pathname.startsWith(path);

  const handleLogout = async () => {
    try {
      setLoggingOut(true);
      await axios.post("/auth/logout", {}, { withCredentials: true });
      logout();
      toast({ title: "Logged out", description: "You have been signed out successfully." });
      navigate("/login");
    } catch {
      toast({ title: "Logout failed", description: "Something went wrong. Please try again.", variant: "destructive" });
    } finally {
      setLoggingOut(false);
    }
  };

  useEffect(() => {
    // Only connect notifications socket when user exists
    if (!user || !user._id) return;

    const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

    const socket = io(backendUrl, {
      transports: ["websocket"],
      withCredentials: true,
    });

    socket.emit("join-user", user._id);

    socket.on("notification", (data: NotificationData) => {
      setNotifications((prev) => [data, ...prev]);
      toast({ title: "🔔 New Notification", description: data.message });
    });

    socketRef.current = socket;

    return () => {
      try {
        socket.disconnect();
      } catch {}
    };
  }, [user]);

  const initials = `${user?.firstName?.[0] || ""}${user?.lastName?.[0] || ""}`.toUpperCase();
  const displayName = user?.firstName ? `${user.firstName} ${user.lastName || ""}` : user?.username || "Guest";

  return (
    <nav className="bg-card border-b border-border sticky top-0 z-50 shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/dashboard" className="text-2xl font-bold text-foreground">DevConnect</Link>

          <div className="flex items-center gap-1">
            {navItems.map((item) => (
              <Link key={item.path} to={item.path} className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${isActive(item.path) ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary hover:text-foreground"}`}>
                <item.icon size={20} />
                <span className="font-medium">{item.label}</span>
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-4 relative">
            <div className="relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input type="text" placeholder="Search..." className="pl-10 w-64" />
            </div>

            <div className="relative">
              <button onClick={() => setShowDropdown((p) => !p)} className="p-2 hover:bg-secondary rounded-lg relative">
                <Bell size={22} className="text-muted-foreground" />
                {notifications.length > 0 && <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full"></span>}
              </button>

              {showDropdown && (
                <div className="absolute right-0 mt-2 w-80 bg-card border border-border rounded-lg shadow-lg p-2 z-50">
                  <h4 className="font-semibold text-foreground mb-2">Notifications</h4>
                  {notifications.length === 0 ? <p className="text-muted-foreground text-sm">No notifications</p> : (
                    <ul className="max-h-64 overflow-y-auto space-y-1">
                      {notifications.map((n, i) => (
                        <li key={i} className="p-2 rounded-md hover:bg-secondary text-sm">
                          {n.message}
                          <br />
                          <span className="text-xs text-muted-foreground">{new Date(n.timestamp).toLocaleTimeString()}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center gap-3">
              <Link to="/profile" className="flex items-center gap-2">
                <Avatar className="h-9 w-9">
                  <AvatarImage src={user?.avatar || ""} />
                  <AvatarFallback className="bg-primary text-primary-foreground">{initials || "U"}</AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium text-foreground">{displayName}</span>
              </Link>

              <Button variant="ghost" size="icon" onClick={handleLogout} disabled={loggingOut} title="Logout">
                <LogOut size={20} />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
