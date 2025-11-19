import { useState, useEffect } from "react";
import Navbar from "@/components/layout/Navbar";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { axiosPrivate } from "@/api/axios";

import { useAuth } from "@/context/AuthContext"; // ✅ Updated path
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";

interface User {
  _id: string;
  username: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
}

const Network = () => {
  const { user, accessToken } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await axiosPrivate.get("/api/users", {
          headers: { Authorization: `Bearer ${accessToken}` },
          withCredentials: true,
        });

        console.log("🔄 Network: Fetched users:", res.data);

        // Exclude logged-in user
        const filtered = res.data.filter((u: User) => u._id !== user?._id);
        setUsers(filtered);
      } catch (error) {
        console.error("❌ Error fetching users:", error);
        toast({
          title: "Error",
          description: "Failed to load developers",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    if (accessToken) {
      fetchUsers();
    }
  }, [accessToken, user]);

  const handleConnect = async (targetId: string) => {
    try {
      await axiosPrivate.post(
        `/api/users/follow/${targetId}`,
        {},
        {
          headers: { Authorization: `Bearer ${accessToken}` },
          withCredentials: true,
        }
      );
      toast({ 
        title: "Success", 
        description: "Connection updated successfully" 
      });
    } catch (error: any) {
      console.error("❌ Error connecting:", error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Unable to connect at the moment",
        variant: "destructive",
      });
    }
  };

  const filteredUsers = users.filter((u) => {
    const fullName = `${u.firstName || ""} ${u.lastName || ""}`.toLowerCase();
    return (
      fullName.includes(searchQuery.toLowerCase()) ||
      u.username.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-6">
          <p className="text-center text-muted-foreground">Loading developers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground mb-4">Developer Network</h1>
          <div className="relative">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              type="text"
              placeholder="Search developers by name or username..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 max-w-md"
            />
          </div>
        </div>

        {filteredUsers.length === 0 ? (
          <Card className="p-12 text-center">
            <p className="text-muted-foreground text-lg mb-2">
              {users.length === 0 ? "No developers found in the network" : "No developers match your search"}
            </p>
            <p className="text-sm text-muted-foreground">
              {users.length === 0 ? "There might be an issue loading developers or no other users have registered yet." : "Try adjusting your search terms."}
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredUsers.map((u) => {
              const initials = `${u.firstName?.[0] || ""}${u.lastName?.[0] || ""}`.toUpperCase();
              return (
                <Card key={u._id} className="p-6 text-center hover:shadow-lg transition-shadow">
                  <div className="flex flex-col items-center">
                    <Avatar className="h-20 w-20 mb-4">
                      <AvatarFallback className="bg-primary text-primary-foreground text-xl">
                        {initials || "U"}
                      </AvatarFallback>
                    </Avatar>

                    <h3 className="font-bold text-lg text-foreground mb-1">
                      {u.firstName || u.username} {u.lastName || ""}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4">@{u.username}</p>

                    <div className="flex gap-2 w-full">
                      <Button
                        variant="outline"
                        onClick={() => navigate(`/profile/${u._id}`)}
                        className="flex-1 bg-transparent hover:bg-accent"
                      >
                        View Profile
                      </Button>
                      <Button 
                        onClick={() => handleConnect(u._id)}
                        className="flex-1 bg-primary hover:bg-primary/90"
                      >
                        Connect
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Network;