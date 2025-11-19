import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/context/AuthContext"; // ✅ Updated path
import { axiosPrivate } from "@/api/axios";
import { useEffect, useState } from "react";

interface UserCounts {
  followers: number;
  following: number;
  posts: number;
}

const UserInfo = () => {
  const { user, accessToken } = useAuth();
  const [counts, setCounts] = useState<UserCounts>({
    followers: 0,
    following: 0,
    posts: 0,
  });

  useEffect(() => {
    const fetchCounts = async () => {
      if (!user?._id) return;
      try {
        // Use the current user data from context for immediate updates
        const followersCount = user.followers?.length || 0;
        const followingCount = user.following?.length || 0;
        const postsCount = user.posts?.length || 0;

        setCounts({
          followers: followersCount,
          following: followingCount,
          posts: postsCount,
        });

        // Optional: Fetch fresh data in background for accuracy
        try {
          const userRes = await axiosPrivate.get(`/api/users/${user._id}`, {
            headers: { Authorization: `Bearer ${accessToken}` },
            withCredentials: true,
          });
          
          const freshUser = userRes.data;
          const freshPostsCount = freshUser.posts?.length || 0;
          
          // Only update if counts changed
          if (freshPostsCount !== postsCount) {
            setCounts(prev => ({
              ...prev,
              posts: freshPostsCount,
            }));
          }
        } catch (error) {
          console.error("Background refresh failed:", error);
        }
      } catch (error) {
        console.error("Error fetching user counts:", error);
      }
    };

    fetchCounts();

    // ✅ Listen for post creation and user updates
    const handleRefresh = () => {
      setTimeout(fetchCounts, 500); // Small delay to ensure data is updated
    };
    
    window.addEventListener("postCreated", handleRefresh);
    window.addEventListener("userUpdated", handleRefresh);

    return () => {
      window.removeEventListener("postCreated", handleRefresh);
      window.removeEventListener("userUpdated", handleRefresh);
    };
  }, [user, accessToken]);

  if (!user) return null;

  const initials = `${user.firstName?.[0] || ""}${user.lastName?.[0] || ""}`.toUpperCase();

  return (
    <Card className="p-6">
      <div className="flex flex-col items-center text-center">
        <Avatar className="h-20 w-20 mb-3">
          <AvatarImage src={user.avatar || ""} alt={user.username} />
          <AvatarFallback className="bg-primary text-primary-foreground text-xl">
            {initials || "U"}
          </AvatarFallback>
        </Avatar>

        <h3 className="font-bold text-lg text-foreground">
          {user.firstName || user.username} {user.lastName || ""}
        </h3>
        <p className="text-sm text-muted-foreground mb-4">@{user.username}</p>

        <div className="flex justify-around w-full pt-4 border-t border-border">
          <div className="text-center">
            <p className="text-2xl font-bold text-foreground">{counts.followers}</p>
            <p className="text-xs text-muted-foreground">Followers</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-foreground">{counts.following}</p>
            <p className="text-xs text-muted-foreground">Following</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-foreground">{counts.posts}</p>
            <p className="text-xs text-muted-foreground">Posts</p>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default UserInfo;