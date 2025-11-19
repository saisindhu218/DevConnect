import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { axiosPrivate } from "@/api/axios";
import { useAuth } from "@/context/AuthContext";
import { toast } from "@/hooks/use-toast";

interface Comment {
  _id: string;
  author: string;
  text: string;
  date: string;
  authorId?: string;
}

const CommentSection = ({
  blogId,
  existingComments = [],
}: {
  blogId: string;
  existingComments?: Comment[];
}) => {
  const [comments, setComments] = useState<Comment[]>(existingComments);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(false);
  const { user, accessToken } = useAuth();

  const handleAddComment = async () => {
    if (!newComment.trim()) {
      toast({
        title: "Empty comment",
        description: "Please write something before posting",
        variant: "destructive",
      });
      return;
    }

    if (!user) {
      toast({
        title: "Login required",
        description: "Please login to comment",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const res = await axiosPrivate.post(
        `/api/blogs/${blogId}/comments`,
        {
          text: newComment,
        },
        {
          headers: { Authorization: `Bearer ${accessToken}` },
          withCredentials: true,
        }
      );

      // Add the new comment to the list
      setComments((prev) => [res.data, ...prev]);
      setNewComment("");
      
      toast({
        title: "Comment posted!",
        description: "Your comment has been added successfully",
      });
    } catch (err: any) {
      console.error("Error posting comment:", err);
      toast({
        title: "Error posting comment",
        description: err.response?.data?.message || "Please try again",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAddComment();
    }
  };

  return (
    <Card className="p-6">
      <h2 className="text-2xl font-bold mb-4">Comments ({comments.length})</h2>

      {/* COMMENTS LIST */}
      <div className="space-y-4 mb-6">
        {comments.length === 0 ? (
          <p className="text-center text-muted-foreground py-4">
            No comments yet. Be the first to comment!
          </p>
        ) : (
          comments.map((comment) => {
            const authorInitials = comment.author
              ? comment.author.substring(0, 2).toUpperCase()
              : "U";

            return (
              <div key={comment._id} className="border-b border-border pb-4 last:border-b-0">
                <div className="flex items-start gap-3">
                  <Avatar className="h-8 w-8 flex-shrink-0">
                    <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                      {authorInitials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold text-sm text-foreground">
                        {comment.author || "Anonymous"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(comment.date).toLocaleDateString()}
                      </p>
                    </div>
                    <p className="text-sm text-foreground whitespace-pre-wrap">
                      {comment.text}
                    </p>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ADD COMMENT */}
      <div className="flex gap-2">
        <Input
          placeholder="Add a comment…"
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          onKeyPress={handleKeyPress}
          className="flex-1"
          disabled={loading}
        />
        <Button 
          onClick={handleAddComment} 
          disabled={loading || !newComment.trim()}
          className="bg-primary hover:bg-primary/90"
        >
          {loading ? "Posting..." : "Post"}
        </Button>
      </div>
    </Card>
  );
};

export default CommentSection;