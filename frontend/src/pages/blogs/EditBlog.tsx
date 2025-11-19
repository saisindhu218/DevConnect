import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { axiosPrivate } from "@/api/axios";   // ✅ FIX HERE

const EditBlog = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    title: "",
    author: "",
    excerpt: "",
    content: "",
  });

  const [loading, setLoading] = useState(true);

  // Load blog data
  useEffect(() => {
    const fetchBlog = async () => {
      try {
        const res = await axiosPrivate.get(`/api/blogs/${id}`);
        const { blog } = res.data;

        setFormData({
          title: blog.title,
          author: blog.author,
          excerpt: blog.excerpt,
          content: blog.content,
        });
      } catch {
        toast({ title: "Failed to load blog", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };

    fetchBlog();
  }, [id]);

  // Save changes
  const handleSave = async () => {
    if (!formData.title.trim() || !formData.content.trim()) {
      toast({ title: "Title and content required", variant: "destructive" });
      return;
    }

    try {
      await axiosPrivate.put(`/api/blogs/${id}`, formData);   // ✅ FIX: axiosPrivate
      toast({ title: "Blog updated successfully!" });
      navigate("/blogs");
    } catch (err) {
      console.error(err);
      toast({ title: "Failed to update blog", variant: "destructive" });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-6 max-w-2xl">
        <Card className="p-6 space-y-4">
          <h1 className="text-3xl font-bold mb-4">Edit Blog</h1>

          <Input
            placeholder="Blog Title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          />

          <Input
            placeholder="Author"
            value={formData.author}
            onChange={(e) => setFormData({ ...formData, author: e.target.value })}
          />

          <Input
            placeholder="Excerpt"
            value={formData.excerpt}
            onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
          />

          <Textarea
            placeholder="Write blog content..."
            rows={10}
            value={formData.content}
            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
          />

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => navigate("/blogs")}>
              Cancel
            </Button>
            <Button onClick={handleSave}>Save</Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default EditBlog;
