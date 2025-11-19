import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import axios from "@/api/axios";

const EditJob = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    title: "",
    company: "",
    location: "",
    salary: "",
    type: "",
    tags: "",
    applyUrl: ""
  });

  const [loading, setLoading] = useState(true);

  // Load job data
  useEffect(() => {
    const fetchJob = async () => {
      try {
        const res = await axios.get(`/api/jobs/${id}`);
        const job = res.data.job;

        setForm({
          title: job.title,
          company: job.company,
          location: job.location,
          salary: job.salary,
          type: job.type,
          tags: job.tags.join(", "),
          applyUrl: job.applyUrl
        });

        setLoading(false);
      } catch (err) {
        toast({
          title: "Error",
          description: "Unable to load job.",
          variant: "destructive"
        });
      }
    };

    fetchJob();
  }, [id]);

  const handleChange = (e: any) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();

    try {
      await axios.put(`/api/jobs/${id}`, {
        ...form,
        tags: form.tags.split(",").map((t) => t.trim())
      });

      toast({
        title: "Job Updated",
        description: "Your job listing has been updated."
      });

      navigate("/jobs");
    } catch (err) {
      toast({
        title: "Error Updating Job",
        description: "Please try again.",
        variant: "destructive"
      });
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <form
        onSubmit={handleSubmit}
        className="max-w-2xl mx-auto p-8 space-y-4"
      >
        <h1 className="text-3xl font-bold mb-4">Edit Job</h1>

        <Input name="title" value={form.title} placeholder="Job Title" onChange={handleChange} required />
        <Input name="company" value={form.company} placeholder="Company" onChange={handleChange} required />
        <Input name="location" value={form.location} placeholder="Location" onChange={handleChange} required />
        <Input name="salary" value={form.salary} placeholder="Salary" onChange={handleChange} />
        <Input name="type" value={form.type} placeholder="Job Type" onChange={handleChange} required />
        <Input name="tags" value={form.tags} placeholder="Tags (comma-separated)" onChange={handleChange} />
        <Input name="applyUrl" value={form.applyUrl} placeholder="Apply URL" onChange={handleChange} required />

        <Button type="submit" className="w-full bg-blue-600 text-white">
          Update Job
        </Button>
      </form>
    </div>
  );
};

export default EditJob;
