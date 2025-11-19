import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { TrendingUp } from "lucide-react";

const activities = [
  { name: "IBM", action: "New Job Listing", avatar: "" },
  { name: "Sally Bars", action: "Shared a post", avatar: "" },
  { name: "Kami Garces", action: "Earned a new certificate", avatar: "" },
  { name: "Netflix", action: "New Job Listing", avatar: "" },
];

const Activity = () => {
  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp size={20} className="text-primary" />
        <h3 className="font-bold text-foreground">Activity</h3>
      </div>
      <div className="space-y-4">
        {activities.map((activity, index) => (
          <div key={index} className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="h-9 w-9">
                <AvatarImage src={activity.avatar} />
                <AvatarFallback className="bg-accent text-accent-foreground">
                  {activity.name[0]}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold text-sm text-foreground">{activity.name}</p>
                <p className="text-xs text-muted-foreground">{activity.action}</p>
              </div>
            </div>
            <button className="text-sm text-primary hover:underline">View</button>
          </div>
        ))}
      </div>
    </Card>
  );
};

export default Activity;
