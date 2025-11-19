import { useState, ChangeEvent } from "react";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Image, Video, Smile, X } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { axiosPrivate } from "@/api/axios";
import { useAuth } from "@/context/AuthContext";

const CreatePost = () => {
  const [postContent, setPostContent] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [posting, setPosting] = useState(false);
  const { user, refreshUser } = useAuth();

  // handle media input
  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setSelectedFiles((prev) => [...prev, ...files]);

    const newPreviews = files.map((file) => URL.createObjectURL(file));
    setPreviewUrls((prev) => [...prev, ...newPreviews]);
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviewUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const handlePost = async () => {
    if (!postContent.trim() && selectedFiles.length === 0) {
      toast({
        title: "Empty post",
        description: "Please write something or attach media.",
        variant: "destructive",
      });
      return;
    }

    setPosting(true);

    try {
      const formData = new FormData();
      formData.append("body", postContent);
      selectedFiles.forEach((file) => formData.append("media", file));

      const res = await axiosPrivate.post("/api/posts", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (res.status === 201) {
        toast({
          title: "Post created",
          description: "Your post has been shared!",
        });

        // clear post UI
        setPostContent("");
        setSelectedFiles([]);
        setPreviewUrls([]);

        // Refresh user data and notify other components
        await refreshUser();
        window.dispatchEvent(new Event("postCreated"));
      }
    } catch (error: any) {
      console.error("❌ Error creating post:", error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Unable to create post.",
        variant: "destructive",
      });
    } finally {
      setPosting(false);
    }
  };

  const initials = `${user?.firstName?.[0] || ""}${user?.lastName?.[0] || ""}`.toUpperCase();

  return (
    <Card className="p-6">
      <div className="flex gap-3">
        <Avatar className="h-10 w-10">
          <AvatarImage src={user?.avatar || ""} />
          <AvatarFallback className="bg-primary text-primary-foreground">
            {initials || "U"}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1">
          {/* INPUT */}
          <Textarea
            placeholder="What's on your mind?"
            value={postContent}
            onChange={(e) => setPostContent(e.target.value)}
            className="min-h-[100px] resize-none mb-3"
            disabled={posting}
          />

          {/* MEDIA PREVIEW */}
          {previewUrls.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {previewUrls.map((url, index) => (
                <div key={index} className="relative w-24 h-24 border rounded-md overflow-hidden">
                  {selectedFiles[index].type.startsWith("video/") ? (
                    <video src={url} controls className="object-cover w-full h-full" />
                  ) : (
                    <img src={url} className="object-cover w-full h-full" />
                  )}

                  <button
                    onClick={() => removeFile(index)}
                    className="absolute top-1 right-1 bg-black/60 rounded-full p-1"
                    disabled={posting}
                  >
                    <X size={14} color="#fff" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* ACTIONS */}
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <Button asChild variant="ghost" size="sm" disabled={posting}>
                <label className="flex items-center cursor-pointer">
                  <Image size={20} className="mr-2" />
                  Photo
                  <input 
                    type="file" 
                    accept="image/*" 
                    multiple 
                    className="hidden" 
                    onChange={handleFileSelect} 
                    disabled={posting}
                  />
                </label>
              </Button>

              <Button asChild variant="ghost" size="sm" disabled={posting}>
                <label className="flex items-center cursor-pointer">
                  <Video size={20} className="mr-2" />
                  Video
                  <input 
                    type="file" 
                    accept="video/*" 
                    multiple 
                    className="hidden" 
                    onChange={handleFileSelect} 
                    disabled={posting}
                  />
                </label>
              </Button>

              <Button variant="ghost" size="sm" disabled={posting}>
                <Smile size={20} className="mr-2" />
                Feeling
              </Button>
            </div>

            <Button onClick={handlePost} disabled={posting}>
              {posting ? "Posting..." : "Post"}
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default CreatePost;