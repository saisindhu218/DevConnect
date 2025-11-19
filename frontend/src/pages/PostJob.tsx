import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { axiosPrivate } from "@/api/axios";
import { useAuth } from "@/context/AuthContext";

const PostJob = () => {
  const navigate = useNavigate();
  const { accessToken } = useAuth();

  const [form, setForm] = useState({
    title: "",
    company: "",
    location: "",
    salary: "",
    type: "",
    tags: "",
    applyUrl: ""
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (e: any) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setLoading(true);

    try {
      await axiosPrivate.post("/api/jobs", {
        ...form,
        tags: form.tags
          .split(",")
          .map((t) => t.trim())
          .filter((t) => t.length > 0)
      }, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        withCredentials: true,
      });

      toast({
        title: "Job Posted Successfully!",
        description: "Your job listing is now live."
      });

      navigate("/jobs");
    } catch (err: any) {
      console.error("❌ Error posting job:", err);
      toast({
        title: "Error Posting Job",
        description: err.response?.data?.message || "Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <form
        onSubmit={handleSubmit}
        className="max-w-2xl mx-auto p-8 space-y-4"
      >
        <h1 className="text-3xl font-bold mb-4">Post a New Job</h1>

        <Input
          name="title"
          placeholder="Job Title"
          value={form.title}
          onChange={handleChange}
          required
        />

        <Input
          name="company"
          placeholder="Company Name"
          value={form.company}
          onChange={handleChange}
          required
        />

        <Input
          name="location"
          placeholder="Location"
          value={form.location}
          onChange={handleChange}
          required
        />

        <Input
          name="salary"
          placeholder="Salary (optional)"
          value={form.salary}
          onChange={handleChange}
        />

        {/* ⭐ Dropdown for Job Type */}
        <select
          name="type"
          className="border rounded-md p-2 w-full bg-background"
          value={form.type}
          onChange={handleChange}
          required
        >
          <option value="">Select Job Type</option>
          <option value="Full-time">Full-time</option>
          <option value="Remote">Remote</option>
          <option value="Contract">Contract</option>
          <option value="Part-time">Part-time</option>
          <option value="Internship">Internship</option>
        </select>

        {/* Tags Input */}
        <Input
          name="tags"
          placeholder="Tags (e.g., React, Node.js, AWS)"
          value={form.tags}
          onChange={handleChange}
        />

        <Input
          name="applyUrl"
          placeholder="Apply URL"
          value={form.applyUrl}
          onChange={handleChange}
          required
        />

        <Button type="submit" className="w-full bg-primary hover:bg-primary/90" disabled={loading}>
          {loading ? "Posting Job..." : "Post Job"}
        </Button>
      </form>
    </div>
  );
};

export default PostJob;