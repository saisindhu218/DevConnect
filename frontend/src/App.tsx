import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";

// ✅ Import all pages - REMOVED ForgotPassword import
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import Network from "./pages/Network";
import Blogs from "./pages/blogs/Blogs";
import BlogDetails from "./pages/blogs/BlogDetails";
import WriteBlog from "./pages/blogs/WriteBlog";
import EditBlog from "./pages/blogs/EditBlog";
import Jobs from "./pages/Jobs";
import PostJob from "./pages/PostJob";
import EditJob from "./pages/EditJob";
import JobDetails from "./pages/JobDetails";
import CollaborateIndex from "./pages/Collaborate/Index";
import CollaborateRoom from "./pages/Collaborate/Room";
import ResetPassword from "./pages/ResetPassword"; // ✅ Keep reset password
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          
          <Routes>
            {/* Redirect root to login */}
            <Route path="/" element={<Navigate to="/login" replace />} />
            
            {/* Auth Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            {/* Protected Routes */}
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/profile/:id" element={<Profile />} />
            <Route path="/network" element={<Network />} />
            
            {/* Blog Routes */}
            <Route path="/blogs" element={<Blogs />} />
            <Route path="/blogs/:id" element={<BlogDetails />} />
            <Route path="/blogs/write" element={<WriteBlog />} />
            <Route path="/blogs/edit/:id" element={<EditBlog />} />
            
            {/* Job Routes */}
            <Route path="/jobs" element={<Jobs />} />
            <Route path="/post-job" element={<PostJob />} />
            <Route path="/jobs/:id" element={<JobDetails />} />
            <Route path="/edit-job/:id" element={<EditJob />} />
            
            {/* Collaboration Routes */}
            <Route path="/collaborate" element={<CollaborateIndex />} />
            <Route path="/collaborate/:roomId" element={<CollaborateRoom />} />
            
            {/* Password Reset Route */}
            <Route path="/reset-password" element={<ResetPassword />} />
            
            {/* 404 Route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
