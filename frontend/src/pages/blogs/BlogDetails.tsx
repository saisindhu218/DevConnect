import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Calendar, Eye, MessageCircle } from "lucide-react";
import CommentSection from "@/components/blogs/CommentSection";
import axios, { axiosPrivate } from "@/api/axios";

const BlogDetails = () => {
  const { id } = useParams<{ id: string }>();
  const [blog, setBlog] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBlog = async () => {
      try {
        const res = await axiosPrivate.get(`/api/blogs/${id}`);
        setBlog(res.data.blog);
        setComments(res.data.comments);
      } catch (error) {
        console.error("Error fetching blog:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchBlog();
  }, [id]);

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground">
        Loading...
      </div>
    );

  if (!blog)
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground">
        Blog not found
      </div>
    );

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container mx-auto px-4 py-6 max-w-3xl">
        <Card className="p-6 mb-6">
          <h1 className="text-4xl font-bold mb-4">{blog.title}</h1>

          <div className="flex items-center gap-4 text-sm text-muted-foreground mb-6">
            <Avatar className="h-10 w-10">
              <AvatarFallback>{blog.author[0]}</AvatarFallback>
            </Avatar>

            <span>{blog.author}</span>

            <Calendar size={14} />
            {new Date(blog.createdAt).toLocaleDateString()}

            <Eye size={14} /> {blog.views} views
            <MessageCircle size={14} /> {comments.length} comments
          </div>

          <p className="whitespace-pre-line leading-relaxed">{blog.content}</p>
        </Card>

        <CommentSection blogId={id!} existingComments={comments} />
      </div>
    </div>
  );
};

export default BlogDetails;
