import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Building2, MapPin, DollarSign, Clock, Calendar } from "lucide-react";
import axios from "@/api/axios";

const JobDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [job, setJob] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchJob = async () => {
      try {
        const res = await axios.get(`/api/jobs/${id}`);
        setJob(res.data.job);
      } catch (error) {
        console.error("Error fetching job:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchJob();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="max-w-3xl mx-auto p-6">
          <p className="text-center text-muted-foreground">Loading job details...</p>
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="max-w-3xl mx-auto p-6">
          <p className="text-center text-muted-foreground">Job not found</p>
          <Button 
            onClick={() => navigate("/jobs")} 
            variant="outline" 
            className="mt-4 bg-primary hover:bg-primary/90"
          >
            ← Back to Jobs
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="max-w-3xl mx-auto p-6 space-y-6">
        <Button 
          onClick={() => navigate("/jobs")} 
          variant="outline"
          className="bg-primary hover:bg-primary/90"
        >
          ← Back to Jobs
        </Button>

        <div className="bg-card border rounded-lg p-6 shadow-sm">
          <h1 className="text-4xl font-bold text-foreground mb-2">{job.title}</h1>
          <p className="text-xl text-muted-foreground mb-6">{job.company}</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Building2 size={20} />
              <span>Company: {job.company}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin size={20} />
              <span>Location: {job.location}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <DollarSign size={20} />
              <span>Salary: {job.salary || "Not specified"}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock size={20} />
              <span>Type: {job.type}</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mb-6">
            <Badge variant="secondary" className="text-sm">
              {job.type}
            </Badge>
            {job.tags?.map((t: string) => (
              <Badge key={t} variant="outline" className="text-sm">
                {t}
              </Badge>
            ))}
          </div>

          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
            <Calendar size={16} />
            <span>Posted: {job.posted}</span>
          </div>

          <a
            href={job.applyUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="block"
          >
            <Button className="w-full bg-primary hover:bg-primary/90 text-lg py-3">
              Apply Now
            </Button>
          </a>
        </div>
      </div>
    </div>
  );
};

export default JobDetails;