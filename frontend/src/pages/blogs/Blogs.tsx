import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Calendar, Eye, MessageCircle } from "lucide-react";
import { axiosPrivate } from "@/api/axios";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";

const Blogs = () => {
  const [blogs, setBlogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { user, accessToken } = useAuth();

  const fetchBlogs = async () => {
    try {
      setLoading(true);
      const res = await axiosPrivate.get("/api/blogs", {
        headers: { Authorization: `Bearer ${accessToken}` },
        withCredentials: true,
      });
      setBlogs(res.data || []);
    } catch (err) {
      console.error("Error fetching blogs:", err);
      toast({
        title: "Error loading blogs",
        description: "Please check your connection and try again",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (accessToken) fetchBlogs();
  }, [accessToken]);

  const isMyBlog = (author: string) => {
    if (!user) return false;
    const lower = author?.trim().toLowerCase();
    const u1 = user.firstName?.trim().toLowerCase();
    const u2 = user.username?.trim().toLowerCase();
    const full = `${user.firstName || ""} ${user.lastName || ""}`
      .trim()
      .toLowerCase();
    return lower === u1 || lower === u2 || lower === full;
  };

  const myBlogs = blogs.filter((b) => isMyBlog(b.author));
  const otherBlogs = blogs.filter((b) => !isMyBlog(b.author));

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this blog?")) return;
    try {
      await axiosPrivate.delete(`/api/blogs/${id}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
        withCredentials: true,
      });
      toast({ title: "Blog deleted successfully ✅" });
      setBlogs((prev) => prev.filter((b) => b._id !== id));
    } catch (err) {
      console.error("Error deleting blog:", err);
      toast({ title: "Failed to delete blog", variant: "destructive" });
    }
  };

  const BlogCard = ({
    blog,
    isMine = false,
  }: {
    blog: any;
    isMine?: boolean;
  }) => (
    <Card className="p-6 hover:shadow-lg transition-shadow border border-border/50">
      <div className="flex gap-4 items-start">
        <Avatar className="h-12 w-12">
          <AvatarFallback className="bg-primary text-primary-foreground">
            {blog.author?.[0]?.toUpperCase() || "A"}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1">
          <h2
            onClick={() => navigate(`/blogs/${blog._id}`)}
            className="text-2xl font-bold text-foreground mb-2 hover:text-primary cursor-pointer"
          >
            {blog.title}
          </h2>
          <p className="text-muted-foreground mb-4">{blog.excerpt}</p>

          <div className="flex flex-wrap items-center gap-5 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Calendar size={16} />
              <span>{new Date(blog.createdAt).toLocaleDateString()}</span>
            </div>
            <div className="flex items-center gap-1">
              <Eye size={16} />
              <span>{blog.views || 0} views</span>
            </div>
            <div className="flex items-center gap-1">
              <MessageCircle size={16} />
              <span>{blog.commentCount || 0} comments</span>
            </div>
            <span className="font-medium text-foreground">by {blog.author}</span>
          </div>
        </div>

        {isMine && (
          <div className="flex flex-col gap-2 items-center">
            {/* EDIT button */}
            <Button size="sm" className="w-28" onClick={() => navigate(`/blogs/edit/${blog._id}`)}>
              Edit
            </Button>

            {/* DELETE also uses PRIMARY color now (no destructive variant) */}
            <Button size="sm" className="w-28" onClick={() => handleDelete(blog._id)}>
              Delete
            </Button>
          </div>
        )}
      </div>
    </Card>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-6">
          <p className="text-center text-muted-foreground">Loading blogs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-foreground">Blogs</h1>

          <Button onClick={() => navigate("/blogs/write")}>Write a Blog</Button>
        </div>

        {/* My Blogs */}
        <div className="mb-10">
          <h2 className="text-xl font-semibold mb-4 text-primary">My Blogs</h2>
          {myBlogs.length === 0 ? (
            <p className="text-muted-foreground text-center">
              You haven't written any blogs yet.
            </p>
          ) : (
            <div className="space-y-6">
              {myBlogs.map((b) => (
                <BlogCard key={b._id} blog={b} isMine />
              ))}
            </div>
          )}
        </div>

        {/* Blogs by Others */}
        <div>
          <h2 className="text-xl font-semibold mb-4 text-primary">Blogs by Others</h2>
          {otherBlogs.length === 0 ? (
            <p className="text-muted-foreground text-center">
              No blogs from others yet.
            </p>
          ) : (
            <div className="space-y-6">
              {otherBlogs.map((b) => (
                <BlogCard key={b._id} blog={b} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Blogs;
