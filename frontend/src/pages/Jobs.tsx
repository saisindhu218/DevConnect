import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Building2, MapPin, DollarSign, Clock } from "lucide-react";
import { axiosPrivate } from "@/api/axios";
import { useAuth } from "@/context/AuthContext";

interface Job {
  _id: string;
  title: string;
  company: string;
  location: string;
  salary: string;
  type: string;
  tags: string[];
  posted: string;
  applyUrl: string;
  createdBy: string;
}

const Jobs = () => {
  const { user, accessToken } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const res = await axiosPrivate.get("/api/jobs", {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          withCredentials: true,
        });
        setJobs(res.data.jobs || res.data || []);
      } catch (err) {
        console.error("Error fetching jobs", err);
      } finally {
        setLoading(false);
      }
    };

    if (accessToken) {
      fetchJobs();
    }
  }, [accessToken]);

  const myJobs = jobs.filter((job) => job.createdBy === user?._id);
  const otherJobs = jobs.filter((job) => job.createdBy !== user?._id);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this job?")) return;

    try {
      await axiosPrivate.delete(`/api/jobs/${id}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        withCredentials: true,
      });
      setJobs(jobs.filter((j) => j._id !== id));
      alert("Job deleted successfully!");
    } catch (error) {
      console.error("Delete failed", error);
      alert("Error deleting job");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-6">
          <p className="text-center text-muted-foreground">Loading jobs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-foreground">Job Listings</h1>

          <Button
            onClick={() => navigate("/post-job")}
            className="bg-primary hover:bg-primary/90"
          >
            Post a Job
          </Button>
        </div>

        {/* ===================== MY JOBS SECTION ===================== */}
        {myJobs.length > 0 && (
          <>
            <h2 className="text-2xl font-bold mb-3">Jobs You Posted</h2>

            <div className="space-y-4 mb-12">
              {myJobs.map((job) => (
                <Card
                  key={job._id}
                  className="p-6 hover:shadow-lg transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h2 className="text-2xl font-bold text-foreground mb-2">
                        {job.title}
                      </h2>

                      <div className="flex flex-wrap items-center gap-4 text-muted-foreground mb-4">
                        <div className="flex items-center gap-1">
                          <Building2 size={16} />
                          <span>{job.company}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <MapPin size={16} />
                          <span>{job.location}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <DollarSign size={16} />
                          <span>{job.salary}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock size={16} />
                          <span>{job.posted}</span>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2 mb-4">
                        <Badge variant="secondary">{job.type}</Badge>
                        {job.tags.map((tag) => (
                          <Badge key={tag} variant="outline">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* EDIT + DELETE BUTTONS */}
                    <div className="flex flex-col gap-3">
                      <Button
                        onClick={() => navigate(`/edit-job/${job._id}`)}
                        className="bg-primary hover:bg-primary/90"
                      >
                        Edit
                      </Button>

                      <Button
                        onClick={() => handleDelete(job._id)}
                        className="bg-primary hover:bg-primary/90"
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </>
        )}

        {/* ===================== OTHER JOBS SECTION ===================== */}
        <h2 className="text-2xl font-bold mb-3">
          {myJobs.length > 0 ? "Other Jobs" : "All Jobs"}
        </h2>

        {otherJobs.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            {jobs.length === 0
              ? "No jobs available yet. Be the first to post one!"
              : "No other jobs available."}
          </p>
        ) : (
          <div className="space-y-4">
            {otherJobs.map((job) => (
              <Card
                key={job._id}
                className="p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold text-foreground mb-2">
                      {job.title}
                    </h2>

                    <div className="flex flex-wrap items-center gap-4 text-muted-foreground mb-4">
                      <div className="flex items-center gap-1">
                        <Building2 size={16} />
                        <span>{job.company}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <MapPin size={16} />
                        <span>{job.location}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <DollarSign size={16} />
                        <span>{job.salary}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock size={16} />
                        <span>{job.posted}</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 mb-4">
                      <Badge variant="secondary">{job.type}</Badge>
                      {job.tags.map((tag) => (
                        <Badge key={tag} variant="outline">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <a href={job.applyUrl} target="_blank" rel="noopener noreferrer">
                    <Button className="bg-primary hover:bg-primary/90">
                      Apply Now
                    </Button>
                  </a>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Jobs;
