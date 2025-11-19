import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { axiosPrivate } from "@/api/axios";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";

interface User {
  _id: string;
  username: string;
  firstName?: string;
  lastName?: string;
}

// ✅ Cache to store the random selection
let cachedUsers: User[] = [];
let lastFetchTime = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

const PeopleYouMayKnow = () => {
  const { user, accessToken } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // ✅ Stable random selection function
  const getStableRandomUsers = (allUsers: User[], count: number): User[] => {
    if (allUsers.length <= count) return allUsers;
    
    // Use a seeded random approach based on user ID for consistency
    const seed = user?._id || 'default';
    const shuffled = [...allUsers].sort((a, b) => {
      const hashA = parseInt(seed + a._id, 36) % 100;
      const hashB = parseInt(seed + b._id, 36) % 100;
      return hashA - hashB;
    });
    
    return shuffled.slice(0, count);
  };

  useEffect(() => {
    const fetchUsers = async () => {
      // ✅ Check cache first
      const now = Date.now();
      if (cachedUsers.length > 0 && now - lastFetchTime < CACHE_DURATION) {
        console.log("🔄 PeopleYouMayKnow: Using cached users");
        setUsers(cachedUsers);
        setLoading(false);
        return;
      }

      try {
        const res = await axiosPrivate.get("/api/users", {
          headers: { Authorization: `Bearer ${accessToken}` },
          withCredentials: true,
        });
        
        console.log("🔄 PeopleYouMayKnow: Fetched users:", res.data.length);
        
        // Filter out current user
        const filtered = res.data.filter((u: User) => u._id !== user?._id);
        
        if (filtered.length > 0) {
          // Get stable random selection (3-4 users)
          const selectedUsers = getStableRandomUsers(filtered, Math.min(4, filtered.length));
          
          // ✅ Update cache
          cachedUsers = selectedUsers;
          lastFetchTime = Date.now();
          
          setUsers(selectedUsers);
        } else {
          setUsers([]);
        }
      } catch (err) {
        console.error("❌ Error fetching users:", err);
        setUsers([]);
      } finally {
        setLoading(false);
      }
    };

    if (accessToken && user?._id) {
      fetchUsers();
    } else {
      setLoading(false);
      setUsers([]);
    }
  }, [user, accessToken]);

  // ✅ Refresh cache when user changes (login/logout)
  useEffect(() => {
    if (user?._id) {
      // Clear cache when user changes to get new recommendations
      cachedUsers = [];
      lastFetchTime = 0;
    }
  }, [user?._id]);

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Users size={20} className="text-primary" />
          <h3 className="font-bold text-foreground">People You May Know</h3>
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3 animate-pulse">
              <div className="h-10 w-10 bg-muted rounded-full"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    );
  }

  if (users.length === 0) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Users size={20} className="text-primary" />
          <h3 className="font-bold text-foreground">People You May Know</h3>
        </div>
        <p className="text-sm text-muted-foreground text-center py-4">
          No other developers found in the network
        </p>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-4">
        <Users size={20} className="text-primary" />
        <h3 className="font-bold text-foreground">People You May Know</h3>
      </div>

      <div className="space-y-4">
        {users.map((u) => {
          const initials = `${u.firstName?.[0] || ""}${u.lastName?.[0] || ""}`.toUpperCase();

          return (
            <div
              key={u._id}
              className="flex items-center justify-between border-b border-border pb-3 last:border-b-0"
            >
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {initials || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-foreground text-sm truncate">
                    {u.firstName || u.username} {u.lastName || ""}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">@{u.username}</p>
                </div>
              </div>

              <Button
                size="sm"
                variant="outline"
                onClick={() => navigate(`/profile/${u._id}`)}
                className="bg-transparent hover:bg-accent whitespace-nowrap"
              >
                View
              </Button>
            </div>
          );
        })}
      </div>
    </Card>
  );
};

export default PeopleYouMayKnow;