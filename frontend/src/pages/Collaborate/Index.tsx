import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/layout/Navbar";
import { axiosPrivate } from "@/api/axios";
import { useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";

interface Project {
  _id: string;
  title: string;
  description: string;
  owner: string;
  ownerName: string;
  skills: string[];
  collaborators?: { _id: string; name: string }[];
  pendingRequests?: { _id: string; name: string }[];
}

const CollaborateIndex = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [myProjects, setMyProjects] = useState<Project[]>([]);
  const [creating, setCreating] = useState(false);
  const [newProject, setNewProject] = useState({
    title: "",
    description: "",
    skills: "",
  });
  const [loading, setLoading] = useState(true);

  const { accessToken, user } = useAuth();
  const navigate = useNavigate();

  // ============================================
  // FETCH PROJECTS
  // ============================================
  const fetchProjects = async () => {
    try {
      setLoading(true);

      const res = await axiosPrivate.get("/api/projects", {
        headers: { Authorization: `Bearer ${accessToken}` },
        withCredentials: true,
      });

      const allProjects: Project[] = res.data;

      // Filter "my projects"
      if (user?._id) {
        const mine = allProjects.filter(
          (p) =>
            p.owner === user._id ||
            p.collaborators?.some((c) => c._id === user._id)
        );
        setMyProjects(mine);
      }

      setProjects(allProjects);
    } catch (err) {
      console.error("❌ Error fetching projects:", err);
      toast({
        title: "Error fetching projects",
        description: "Please check your connection and try again",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (accessToken) fetchProjects();
  }, [accessToken]);

  // ============================================
  // CREATE PROJECT
  // ============================================
  const handleCreate = async () => {
    if (!newProject.title.trim()) {
      toast({ title: "Title required", variant: "destructive" });
      return;
    }

    try {
      await axiosPrivate.post(
        "/api/projects",
        {
          title: newProject.title,
          description: newProject.description,
          skills: newProject.skills.split(",").map((s) => s.trim()),
        },
        {
          headers: { Authorization: `Bearer ${accessToken}` },
          withCredentials: true,
        }
      );

      toast({ title: "Project created successfully ✅" });

      setCreating(false);
      setNewProject({ title: "", description: "", skills: "" });
      fetchProjects();
    } catch (err) {
      console.error("❌ Error creating project:", err);
      toast({
        title: "Error creating project",
        description: "Please try again",
        variant: "destructive",
      });
    }
  };

  // ============================================
  // REQUEST TO JOIN PROJECT
  // ============================================
  const handleRequestToJoin = async (projectId: string) => {
    try {
      await axiosPrivate.post(
        `/api/projects/${projectId}/request`,
        {},
        {
          headers: { Authorization: `Bearer ${accessToken}` },
          withCredentials: true,
        }
      );

      toast({ title: "Request sent to project owner!" });
      fetchProjects();
    } catch (err: any) {
      console.error("❌ Error requesting to join:", err);
      toast({
        title: "Unable to send request",
        description: err.response?.data?.message || "Please try again",
        variant: "destructive",
      });
    }
  };

  // ============================================
  // APPROVE REQUEST
  // ============================================
  const handleApprove = async (projectId: string, requesterId: string) => {
    try {
      await axiosPrivate.post(
        `/api/projects/${projectId}/approve`,
        { userId: requesterId },
        {
          headers: { Authorization: `Bearer ${accessToken}` },
          withCredentials: true,
        }
      );

      toast({ title: "Collaborator approved ✅" });
      fetchProjects();
    } catch (err) {
      console.error("❌ Error approving request:", err);
      toast({ title: "Approval failed", variant: "destructive" });
    }
  };

  // ============================================
  // CHECK IF USER IS OWNER OR COLLABORATOR
  // ============================================
  const isOwnerOrCollaborator = (project: Project) => {
    if (!user?._id) return false;
    return (
      project.owner === user._id ||
      project.collaborators?.some((c) => c._id === user._id)
    );
  };

  // ============================================
  // LOADING STATE
  // ============================================
  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-6">
          <p className="text-center text-muted-foreground">
            Loading projects...
          </p>
        </div>
      </div>
    );
  }

  // ============================================
  // MAIN UI
  // ============================================
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container mx-auto px-4 py-6 space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-foreground">
            Collaborate on Projects
          </h1>

          <Button
            onClick={() => setCreating(!creating)}
            className="bg-primary hover:bg-primary/90"
          >
            {creating ? "Cancel" : "➕ Create Project"}
          </Button>
        </div>

        {/* ============================================
           CREATE PROJECT FORM
        ============================================ */}
        {creating && (
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">New Project</h2>
            <div className="space-y-3">
              <Input
                placeholder="Project Title"
                value={newProject.title}
                onChange={(e) =>
                  setNewProject({ ...newProject, title: e.target.value })
                }
              />
              <Textarea
                placeholder="Description"
                value={newProject.description}
                onChange={(e) =>
                  setNewProject({ ...newProject, description: e.target.value })
                }
              />
              <Input
                placeholder="Skills (comma separated)"
                value={newProject.skills}
                onChange={(e) =>
                  setNewProject({ ...newProject, skills: e.target.value })
                }
              />
              <Button
                onClick={handleCreate}
                className="bg-primary hover:bg-primary/90"
              >
                Create
              </Button>
            </div>
          </Card>
        )}

        {/* ============================================
           MY PROJECTS
        ============================================ */}
        {myProjects.length > 0 && (
          <div>
            <h2 className="text-2xl font-semibold mb-4">My Projects</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {myProjects.map((project) => (
                <Card key={project._id} className="p-4">
                  <h3 className="text-xl font-semibold mb-1">
                    {project.title}
                  </h3>

                  <p className="text-sm text-muted-foreground mb-3">
                    {project.description}
                  </p>

                  <div className="flex flex-wrap gap-2 mb-3">
                    {project.skills?.map((skill, i) => (
                      <span
                        key={i}
                        className="px-2 py-1 text-xs rounded-full bg-secondary text-foreground"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>

                  <Button
                    className="mb-3 w-full bg-primary hover:bg-primary/90"
                    onClick={() => navigate(`/collaborate/${project._id}`)}
                  >
                    Continue Working
                  </Button>

                  {/* ============================================
                      SHOW PENDING REQUESTS ONLY TO OWNER
                  ============================================ */}
                  {user?._id === project.owner &&
                    project.pendingRequests &&
                    project.pendingRequests.length > 0 && (
                      <div>
                        <h4 className="font-semibold mb-2">
                          Pending Requests:
                        </h4>

                        {project.pendingRequests.map((req) => (
                          <div
                            key={req._id}
                            className="flex items-center justify-between mb-2 border-b pb-2"
                          >
                            <p className="text-sm">{req.name || "@user"}</p>
                            <Button
                              size="sm"
                              onClick={() =>
                                handleApprove(project._id, req._id)
                              }
                              className="bg-green-600 hover:bg-green-700"
                            >
                              Approve
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* ============================================
           ALL PROJECTS
        ============================================ */}
        <div>
          <h2 className="text-2xl font-semibold mb-4">
            {myProjects.length > 0 ? "All Projects" : "Available Projects"}
          </h2>

          {projects.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground text-lg">
                No collaboration projects found.
              </p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map((project) => (
                <Card
                  key={project._id}
                  className="p-4 flex flex-col justify-between hover:shadow-lg transition-shadow"
                >
                  <div>
                    <h2 className="text-xl font-semibold mb-1">
                      {project.title}
                    </h2>

                    <p className="text-sm text-muted-foreground mb-3">
                      {project.description || "No description provided"}
                    </p>

                    <div className="flex items-center gap-2 mb-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          {project.ownerName?.[0] || "U"}
                        </AvatarFallback>
                      </Avatar>

                      <p className="text-sm font-medium">{project.ownerName}</p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {project.skills?.map((skill, i) => (
                        <span
                          key={i}
                          className="px-2 py-1 text-xs rounded-full bg-secondary text-foreground"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* BUTTON LOGIC */}
                  {isOwnerOrCollaborator(project) ? (
                    <Button
                      className="mt-4 bg-primary hover:bg-primary/90"
                      onClick={() => navigate(`/collaborate/${project._id}`)}
                    >
                      Continue Working
                    </Button>
                  ) : (
                    <Button
                      className="mt-4 bg-blue-600 hover:bg-blue-700"
                      onClick={() => handleRequestToJoin(project._id)}
                    >
                      Request to Join
                    </Button>
                  )}
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CollaborateIndex;
