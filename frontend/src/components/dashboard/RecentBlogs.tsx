import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { FileText } from "lucide-react";

const blogs = [
  { title: "Clean up your resume", author: "Career Tips", comments: 20 },
  { title: "React v20.5", author: "Tech News", comments: 5 },
  { title: "MERN Stack", author: "Web Dev", comments: 15 },
  { title: "How to train a dragon", author: "Fantasy", comments: 8 },
];

const RecentBlogs = () => {
  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <FileText size={20} className="text-primary" />
          <h3 className="font-bold text-foreground">Recent Blogs</h3>
        </div>
        <button className="text-sm text-primary hover:underline">View All</button>
      </div>
      <div className="space-y-4">
        {blogs.map((blog, index) => (
          <div key={index} className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="h-9 w-9">
                <AvatarImage src="" />
                <AvatarFallback className="bg-accent text-accent-foreground">
                  {blog.author[0]}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold text-sm text-foreground">{blog.title}</p>
                <p className="text-xs text-muted-foreground">{blog.comments} comments</p>
              </div>
            </div>
            <button className="text-sm text-primary hover:underline">View</button>
          </div>
        ))}
      </div>
    </Card>
  );
};

export default RecentBlogs;
