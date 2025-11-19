import { useState, useEffect } from "react";
import { axiosPrivate } from "@/api/axios";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Heart, MessageCircle, Share, MoreHorizontal, Image as ImageIcon } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface Post {
  _id: string;
  body: string;
  author: {
    _id: string;
    username: string;
    firstName?: string;
    lastName?: string;
    avatar?: string;
  };
  media: {
    images: string[];
  };
  likes: string[];
  comments: any[];
  createdAt: string;
  updatedAt: string;
}

const PostFeed = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    fetchPosts();
  }, []);

  // Listen for new posts
  useEffect(() => {
    const handlePostCreated = () => {
      console.log("🔄 PostFeed: New post created, refreshing...");
      fetchPosts();
    };

    window.addEventListener("postCreated", handlePostCreated);
    return () => window.removeEventListener("postCreated", handlePostCreated);
  }, []);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const response = await axiosPrivate.get("/api/posts");
      console.log("📸 Posts data:", response.data); // Debug log
      setPosts(response.data.posts || []);
    } catch (error: any) {
      console.error("❌ Error fetching posts:", error);
      toast({
        title: "Error loading posts",
        description: error.response?.data?.message || "Failed to load posts",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (postId: string) => {
    if (!user) {
      toast({
        title: "Please login",
        description: "You need to be logged in to like posts",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await axiosPrivate.post(`/api/posts/${postId}/like`);
      // Update the posts with the new like status
      setPosts(prevPosts =>
        prevPosts.map(post =>
          post._id === postId
            ? { ...post, likes: response.data.likes }
            : post
        )
      );
    } catch (error: any) {
      console.error("❌ Error liking post:", error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to like post",
        variant: "destructive",
      });
    }
  };

  // ✅ FIXED: Resolve image URLs properly
  const resolveImageUrl = (imagePath: string) => {
    if (!imagePath) return "";
    
    // If it's already a full URL, return as is
    if (imagePath.startsWith('http')) return imagePath;
    
    // If it starts with /uploads, prepend the backend URL
    if (imagePath.startsWith('/uploads')) {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
      return `${backendUrl}${imagePath}`;
    }
    
    // If it's just a filename, construct the full URL
    const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
    return `${backendUrl}/uploads/${imagePath}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      return "Just now";
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const getInitials = (firstName?: string, lastName?: string, username?: string) => {
    if (firstName && lastName) {
      return `${firstName[0]}${lastName[0]}`.toUpperCase();
    }
    return username ? username[0].toUpperCase() : "U";
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-2 text-muted-foreground">Loading posts...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {posts.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-muted-foreground">
              <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">No posts yet</h3>
              <p>Be the first to share something with the community!</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        posts.map((post) => (
          <Card key={post._id} className="overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage 
                      src={post.author.avatar} 
                      alt={post.author.username}
                    />
                    <AvatarFallback>
                      {getInitials(post.author.firstName, post.author.lastName, post.author.username)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold text-sm">
                        {post.author.firstName && post.author.lastName
                          ? `${post.author.firstName} ${post.author.lastName}`
                          : post.author.username}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {formatDate(post.createdAt)}
                    </span>
                  </div>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            
            <CardContent className="pb-3">
              {/* Post Text */}
              {post.body && (
                <p className="text-sm whitespace-pre-wrap mb-4">{post.body}</p>
              )}
              
              {/* ✅ FIXED: Image Display */}
              {post.media?.images && post.media.images.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <ImageIcon size={16} />
                    <span>{post.media.images.length} photo{post.media.images.length > 1 ? 's' : ''}</span>
                  </div>
                  
                  <div className={`grid gap-2 ${
                    post.media.images.length === 1 ? 'grid-cols-1' : 
                    post.media.images.length === 2 ? 'grid-cols-2' : 
                    'grid-cols-2 md:grid-cols-3'
                  }`}>
                    {post.media.images.map((imageUrl, index) => {
                      const fullImageUrl = resolveImageUrl(imageUrl);
                      console.log(`🖼️ Image ${index}:`, { original: imageUrl, resolved: fullImageUrl }); // Debug log
                      
                      return (
                        <div 
                          key={index} 
                          className={`relative rounded-lg overflow-hidden bg-muted ${
                            post.media.images.length === 1 ? 'max-w-2xl mx-auto' : ''
                          }`}
                        >
                          <img
                            src={fullImageUrl}
                            alt={`Post image ${index + 1}`}
                            className="w-full h-auto object-cover cursor-pointer hover:opacity-90 transition-opacity"
                            onError={(e) => {
                              console.error(`❌ Failed to load image: ${fullImageUrl}`);
                              // Optional: Set a placeholder image on error
                              // e.currentTarget.src = '/placeholder-image.jpg';
                            }}
                            onClick={() => {
                              // Optional: Add image modal view here
                              console.log("Clicked image:", fullImageUrl);
                            }}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </CardContent>

            <div className="px-6 pb-3">
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <div className="flex items-center space-x-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex items-center space-x-1 h-8 px-2"
                    onClick={() => handleLike(post._id)}
                  >
                    <Heart
                      className={`h-4 w-4 ${
                        user && post.likes.includes(user._id)
                          ? "fill-red-500 text-red-500"
                          : ""
                      }`}
                    />
                    <span>{post.likes.length}</span>
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex items-center space-x-1 h-8 px-2"
                  >
                    <MessageCircle className="h-4 w-4" />
                    <span>{post.comments?.length || 0}</span>
                  </Button>
                </div>
                
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2"
                >
                  <Share className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>
        ))
      )}
    </div>
  );
};

export default PostFeed;