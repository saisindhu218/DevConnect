import { useEffect } from "react";
import Navbar from "@/components/layout/Navbar";
import UserInfo from "@/components/dashboard/UserInfo";
import PeopleYouMayKnow from "@/components/dashboard/PeopleYouMayKnow";
import TypingQuote from "@/components/dashboard/TypingQuote";
import CreatePost from "@/components/dashboard/CreatePost";
import PostFeed from "@/components/dashboard/PostFeed";
import Activity from "@/components/dashboard/Activity";
import RecentBlogs from "@/components/dashboard/RecentBlogs";
import { useAuth } from "@/context/AuthContext";

const Dashboard = () => {
  const { user, accessToken, refreshUser } = useAuth();

  // Refresh user data when dashboard loads
  useEffect(() => {
    const loadUserData = async () => {
      if (accessToken && user) {
        console.log("🔄 Dashboard: Refreshing user data...");
        await refreshUser();
      }
    };

    loadUserData();
  }, [accessToken]); // Removed refreshUser from dependencies to prevent loops

  // Show loading state
  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading your dashboard...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container mx-auto px-4 py-6">
        {/* Welcome Message */}
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">
            Welcome back, {user.firstName || user.username}! 👋
          </h1>
          <p className="text-muted-foreground mt-1">
            Here's what's happening in your developer community today.
          </p>
        </div>

        {/* Main Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Sidebar - User Info & Connections */}
          <div className="lg:col-span-3 space-y-6">
            <UserInfo />
            <PeopleYouMayKnow />
          </div>

          {/* Main Content - Posts & Activity */}
          <div className="lg:col-span-6 space-y-6">
            <TypingQuote />
            <CreatePost />
            <PostFeed />
          </div>

          {/* Right Sidebar - Activity & Blogs */}
          <div className="lg:col-span-3 space-y-6">
            <Activity />
            <RecentBlogs />
          </div>
        </div>

        {/* Mobile Layout Adjustments */}
        <div className="block lg:hidden mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Activity />
            <RecentBlogs />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;