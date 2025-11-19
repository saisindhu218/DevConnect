import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { axiosPrivate } from "@/api/axios"; // ⭐ Correct import

const WriteBlog = () => {
  const [form, setForm] = useState({
    title: "",
    author: "",
    excerpt: "",
    content: "",
  });

  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    if (!form.title || !form.author || !form.content) {
      toast({
        title: "Missing fields",
        description: "Please fill title, author, and content.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      await axiosPrivate.post("/api/blogs", {
        title: form.title,
        content: form.content,
      });

      toast({ title: "Blog published successfully!" });
      navigate("/blogs");
    } catch (err) {
      console.error("Error publishing blog:", err);
      toast({
        title: "Error",
        description: "Could not publish your blog.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <Card className="p-6">
          <h1 className="text-3xl font-bold mb-6 text-foreground">
            Write a Blog
          </h1>

          <div className="space-y-4">
            <Input
              name="title"
              placeholder="Blog Title"
              value={form.title}
              onChange={handleChange}
            />

            <Input
              name="author"
              placeholder="Author Name"
              value={form.author}
              onChange={handleChange}
            />

            <Input
              name="excerpt"
              placeholder="Short Description (optional)"
              value={form.excerpt}
              onChange={handleChange}
            />

            <Textarea
              name="content"
              placeholder="Write your blog content here..."
              rows={10}
              value={form.content}
              onChange={handleChange}
            />
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <Button variant="secondary" onClick={() => navigate("/blogs")}>
              Cancel
            </Button>

            <Button onClick={handleSubmit} disabled={loading}>
              {loading ? "Publishing..." : "Publish Blog"}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default WriteBlog;
