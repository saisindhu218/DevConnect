// frontend/src/pages/Profile.tsx
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MapPin, Link as LinkIcon, X, Plus, Trash, Code2, BookText, MessageSquare } from "lucide-react";
import { useAuth, User } from "@/context/AuthContext";
import axios, { axiosPrivate } from "@/api/axios";
import { toast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const Profile = () => {
  const navigate = useNavigate();
  const { user: me, setAuth, accessToken } = useAuth();
  const { id } = useParams<{ id?: string }>();
  const viewingOwn = !id || id === me?._id;

  const [user, setUser] = useState<User | null>(viewingOwn ? me : null);
  const [posts, setPosts] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [blogs, setBlogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    bio: "",
    location: "",
    skills: "",
    experience: [] as { title: string; company: string; years: string }[],
    education: [] as { degree: string; school: string; years: string }[],
  });

  const getBackendBase = () => import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

  const resolveMediaUrl = (url: string) => {
    if (!url) return "";
    if (url.startsWith("http")) return url;
    if (url.startsWith("/uploads")) return `${getBackendBase()}${url}`;
    const fileName = url.split(/[/\\]/).pop();
    return `${getBackendBase()}/uploads/${fileName}`;
  };

  const fetchUserData = async () => {
    try {
      if (viewingOwn && me) {
        setUser(me);
        setFormData({
          firstName: me.firstName || "",
          lastName: me.lastName || "",
          bio: me.bio || "",
          location: me.location || "",
          skills: me.skills?.join(", ") || "",
          experience: me.experience || [],
          education: me.education || [],
        });
      } else if (!viewingOwn && id) {
        const res = await axiosPrivate.get(`/api/users/${id}`);
        setUser(res.data);
      }
    } catch (err) {
      console.error("Error loading user:", err);
    }
  };

  const fetchPosts = async () => {
    try {
      const targetId = viewingOwn ? me?._id : id;
      if (!targetId) return;
      const res = await axiosPrivate.get(`/api/posts/user/${targetId}`);
      setPosts(res.data || []);
    } catch (err) {
      console.error("Error fetching posts:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadInitialData = async () => {
      await fetchUserData();
      await fetchPosts();
    };
    loadInitialData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, me, viewingOwn, accessToken]);

  useEffect(() => {
    const handlePostCreated = () => {
      setTimeout(() => {
        fetchUserData();
        fetchPosts();
      }, 300);
    };
    const handleUserUpdated = () => {
      setTimeout(() => {
        fetchUserData();
        fetchPosts();
      }, 300);
    };
    window.addEventListener("postCreated", handlePostCreated);
    window.addEventListener("userUpdated", handleUserUpdated);
    return () => {
      window.removeEventListener("postCreated", handlePostCreated);
      window.removeEventListener("userUpdated", handleUserUpdated);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewingOwn, me, accessToken]);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const res = await axiosPrivate.get(`/api/projects`);
        setProjects(res.data || []);
      } catch (err) {
        console.error("Error fetching projects:", err);
      }
    };
    if (user?._id && accessToken) fetchProjects();
  }, [user, accessToken]);

  useEffect(() => {
    const fetchBlogs = async () => {
      try {
        const res = await axios.get(`/api/blogs`);
        const allBlogs = res.data || [];
        if (me) {
          const myName = (me.firstName + " " + (me.lastName || "")).trim().toLowerCase();
          const myUsername = me.username?.trim().toLowerCase();
          const myFirst = me.firstName?.trim().toLowerCase();

          const myBlogs = allBlogs.filter((b: any) => {
            const authorLower = b.author?.trim().toLowerCase();
            return authorLower === myName || authorLower === myUsername || authorLower === myFirst;
          });

          setBlogs(myBlogs);
        } else setBlogs([]);
      } catch (err) {
        console.error("Error fetching blogs:", err);
      }
    };
    fetchBlogs();
  }, [me]);

  const handleSave = async () => {
    try {
      const updateData = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        bio: formData.bio.trim(),
        location: formData.location.trim(),
        skills: formData.skills.split(",").map((s) => s.trim()).filter(Boolean),
        experience: formData.experience.filter((e) => e.title && e.company),
        education: formData.education.filter((e) => e.degree && e.school),
      };

      const res = await axiosPrivate.put(`/api/users/update`, updateData);

      if (res.data?.user) {
        setAuth(res.data.user, accessToken || "");
        setUser(res.data.user);
        toast({ title: "Profile updated successfully ✅" });
        setIsEditing(false);
        window.dispatchEvent(new Event("userUpdated"));
      }
    } catch (err: any) {
      console.error("Error updating profile:", err);
      toast({
        title: "Update failed",
        description: err.response?.data?.message || "Could not update your profile.",
        variant: "destructive",
      });
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading profile...</p>
        </div>
      </div>
    );
  }

  const initials = `${user.firstName?.[0] || ""}${user.lastName?.[0] || ""}`.toUpperCase();
  const postCount = posts.length;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-6">
        <Card className="mb-6 overflow-hidden">
          <div className="h-40 bg-gradient-to-r from-primary to-accent"></div>
          <div className="px-6 pb-6">
            <div className="flex items-end justify-between -mt-16 mb-4">
              <Avatar className="h-32 w-32 border-4 border-card">
                <AvatarImage src={user.avatar || ""} alt={user.username} />
                <AvatarFallback className="bg-primary text-primary-foreground text-3xl">{initials || "U"}</AvatarFallback>
              </Avatar>

              {viewingOwn ? <Button onClick={() => setIsEditing(true)}>Edit Profile</Button> : <Button>Connect</Button>}
            </div>

            <h1 className="text-3xl font-bold mb-1">{user.firstName || user.username} {user.lastName || ""}</h1>
            <p className="text-muted-foreground mb-3">@{user.username}</p>

            <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
              <div className="flex items-center gap-1"><MapPin size={16} /><span>{user.location || "Location not set"}</span></div>
              <div className="flex items-center gap-1"><LinkIcon size={16} /><span>No website</span></div>
            </div>

            <p className="text-foreground mb-4">{user.bio || "No bio added yet"}</p>

            <div className="flex gap-6 text-sm">
              <div><span className="font-bold">{user.followers?.length || 0}</span> Followers</div>
              <div><span className="font-bold">{user.following?.length || 0}</span> Following</div>
              <div><span className="font-bold">{postCount}</span> Posts</div>
            </div>
          </div>
        </Card>

        <Tabs defaultValue="about" className="w-full">
          <TabsList className="w-full justify-start bg-card mb-6">
            <TabsTrigger value="about">About</TabsTrigger>
            <TabsTrigger value="posts">Posts</TabsTrigger>
            <TabsTrigger value="projects">Projects</TabsTrigger>
            <TabsTrigger value="blogs">Blogs</TabsTrigger>
          </TabsList>

          <TabsContent value="posts">
            <Card className="p-6 space-y-4">
              {loading ? <div className="text-center text-muted-foreground"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2"></div><p>Loading posts...</p></div> :
                posts.length === 0 ? <p className="text-center text-muted-foreground">No posts created yet.</p> :
                  posts.map((post) => (
                    <div key={post._id} className="border border-border rounded-lg p-3 hover:border-primary/50 hover:bg-accent/10 transition space-y-3">
                      <p className="text-foreground whitespace-pre-wrap">{post.body}</p>
                      {post.media?.images?.length > 0 && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                          {post.media.images.map((url: string, idx: number) => {
                            const resolvedUrl = resolveMediaUrl(url);
                            const isVideo = resolvedUrl.match(/\.(mp4|mov|avi|mkv|webm)$/i);
                            return (
                              <div key={idx} className="rounded-lg overflow-hidden bg-muted flex justify-center items-center">
                                {isVideo ? (<video src={resolvedUrl} controls className="max-w-full max-h-[400px] rounded-lg" />) : (
                                  <img src={resolvedUrl} alt="Post media" className="max-w-full max-h-[400px] rounded-lg object-contain" />
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                      <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1"><MessageSquare size={12} /> {new Date(post.createdAt).toLocaleString()}</p>
                    </div>
                  ))
              }
            </Card>
          </TabsContent>

          <TabsContent value="about">
            <Card className="p-6 space-y-6">
              <div>
                <h2 className="text-xl font-bold mb-2">Skills</h2>
                <div className="flex flex-wrap gap-2">
                  {user.skills?.length ? user.skills.map((skill, index) => (
                    <span key={index} className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm">{skill}</span>
                  )) : <p className="text-muted-foreground">No skills added yet</p>}
                </div>
              </div>

              <div>
                <h2 className="text-xl font-bold mb-2">Experience</h2>
                {user.experience?.length ? user.experience.map((e, i) => (
                  <div key={i} className="mb-3 p-3 bg-accent/10 rounded-lg"><p className="font-semibold">💼 {e.title}</p><p className="text-muted-foreground">{e.company} • {e.years}</p></div>
                )) : <p className="text-muted-foreground">No experience added yet</p>}
              </div>

              <div>
                <h2 className="text-xl font-bold mb-2">Education</h2>
                {user.education?.length ? user.education.map((ed, i) => (
                  <div key={i} className="mb-3 p-3 bg-accent/10 rounded-lg"><p className="font-semibold">🎓 {ed.degree}</p><p className="text-muted-foreground">{ed.school} • {ed.years}</p></div>
                )) : <p className="text-muted-foreground">No education added yet</p>}
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="projects">
            <Card className="p-6 space-y-3">
              {projects.length === 0 ? <p className="text-center text-muted-foreground">No projects yet</p> : projects.map((p) => (
                <div key={p._id} onClick={() => navigate(`/collaborate/${p._id}`)} className="border border-border hover:border-primary/50 hover:bg-accent/10 transition cursor-pointer rounded-lg p-3 flex items-start justify-between">
                  <div className="flex items-start gap-3"><Code2 className="text-primary mt-1" /><div><p className="font-semibold text-lg text-foreground">{p.title}</p><p className="text-sm text-muted-foreground">{p.description || "No description"}</p></div></div>
                  <Button variant="outline" size="sm" className="text-blue-600 border-blue-600 hover:bg-blue-600 hover:text-white">Open</Button>
                </div>
              ))}
            </Card>
          </TabsContent>

          <TabsContent value="blogs">
            <Card className="p-6 space-y-3">
              {blogs.length === 0 ? <p className="text-center text-muted-foreground">No blogs created by you yet.</p> : blogs.map((b) => (
                <div key={b._id} onClick={() => navigate(`/blogs/${b._id}`)} className="border border-border hover:border-primary/50 hover:bg-accent/10 transition cursor-pointer rounded-lg p-3 flex justify-between">
                  <div className="flex items-start gap-3"><BookText className="text-primary mt-1" /><div><p className="font-semibold text-lg text-foreground">{b.title}</p><p className="text-sm text-muted-foreground">{b.excerpt}</p><p className="text-xs mt-1 text-muted-foreground italic">by {b.author} — {new Date(b.createdAt).toLocaleDateString()}</p></div></div>
                  <Button variant="outline" size="sm" className="text-blue-600 border-blue-600 hover:bg-blue-600 hover:text-white">Read</Button>
                </div>
              ))}
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {isEditing && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="bg-card p-6 w-full max-w-2xl relative max-h-[90vh] overflow-y-auto">
            <button className="absolute right-4 top-4 text-muted-foreground hover:text-foreground" onClick={() => setIsEditing(false)}><X size={20} /></button>
            <h2 className="text-2xl font-bold mb-4">Edit Profile</h2>
            <div className="space-y-3">
              <Input placeholder="First Name" value={formData.firstName} onChange={(e) => setFormData({ ...formData, firstName: e.target.value })} />
              <Input placeholder="Last Name" value={formData.lastName} onChange={(e) => setFormData({ ...formData, lastName: e.target.value })} />
              <Textarea placeholder="Bio" value={formData.bio} onChange={(e) => setFormData({ ...formData, bio: e.target.value })} />
              <Input placeholder="Location" value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} />
              <Input placeholder="Skills (comma-separated)" value={formData.skills} onChange={(e) => setFormData({ ...formData, skills: e.target.value })} />

              <div className="border-t pt-4 mt-4">
                <h3 className="font-semibold mb-3 flex justify-between items-center">
                  Experience
                  <Button size="sm" variant="outline" onClick={() => setFormData({ ...formData, experience: [...formData.experience, { title: "", company: "", years: "" }] })}><Plus size={14} /> Add</Button>
                </h3>
                {formData.experience.map((e, i) => (
                  <div key={i} className="grid grid-cols-1 md:grid-cols-4 gap-2 items-center mb-3 bg-accent/10 p-2 rounded-md">
                    <Input placeholder="Title" value={e.title} onChange={(ev) => setFormData({ ...formData, experience: formData.experience.map((x, j) => j === i ? { ...x, title: ev.target.value } : x) })} />
                    <Input placeholder="Company" value={e.company} onChange={(ev) => setFormData({ ...formData, experience: formData.experience.map((x, j) => j === i ? { ...x, company: ev.target.value } : x) })} />
                    <Input placeholder="Years" value={e.years} onChange={(ev) => setFormData({ ...formData, experience: formData.experience.map((x, j) => j === i ? { ...x, years: ev.target.value } : x) })} />
                    <Button size="icon" variant="outline" className="w-8 h-8 text-red-600 border-red-600 hover:bg-red-600 hover:text-white" onClick={() => setFormData({ ...formData, experience: formData.experience.filter((_, j) => j !== i) })}><Trash size={14} /></Button>
                  </div>
                ))}
              </div>

              <div className="border-t pt-4 mt-4">
                <h3 className="font-semibold mb-3 flex justify-between items-center">
                  Education
                  <Button size="sm" variant="outline" onClick={() => setFormData({ ...formData, education: [...formData.education, { degree: "", school: "", years: "" }] })}><Plus size={14} /> Add</Button>
                </h3>
                {formData.education.map((ed, i) => (
                  <div key={i} className="grid grid-cols-1 md:grid-cols-4 gap-2 items-center mb-3 bg-accent/10 p-2 rounded-md">
                    <Input placeholder="Degree" value={ed.degree} onChange={(ev) => setFormData({ ...formData, education: formData.education.map((x, j) => j === i ? { ...x, degree: ev.target.value } : x) })} />
                    <Input placeholder="School" value={ed.school} onChange={(ev) => setFormData({ ...formData, education: formData.education.map((x, j) => j === i ? { ...x, school: ev.target.value } : x) })} />
                    <Input placeholder="Years" value={ed.years} onChange={(ev) => setFormData({ ...formData, education: formData.education.map((x, j) => j === i ? { ...x, years: ev.target.value } : x) })} />
                    <Button size="icon" variant="outline" className="w-8 h-8 text-red-600 border-red-600 hover:bg-red-600 hover:text-white" onClick={() => setFormData({ ...formData, education: formData.education.filter((_, j) => j !== i) })}><Trash size={14} /></Button>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button variant="secondary" onClick={() => setIsEditing(false)}>Cancel</Button>
              <Button onClick={handleSave}>Save Changes</Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Profile;
