import { User } from "@/lib/db";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardHeader, CardContent } from "@/components/ui/card";

interface ProfileCardProps {
  user: User;
}

export function ProfileCard({ user }: ProfileCardProps) {
  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center gap-4">
        <Avatar className="h-20 w-20">
          <AvatarImage src={user.avatar_url || undefined} alt={user.name} />
          <AvatarFallback>{user.name[0].toUpperCase()}</AvatarFallback>
        </Avatar>
        <div>
          <h1 className="text-2xl font-bold">{user.name}</h1>
          <p className="text-sm text-muted-foreground">@{user.username}</p>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Wallet:</span>
            <code className="text-sm">{user.wallet_address}</code>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Joined:</span>
            <span className="text-sm">
              {new Date(user.created_at).toLocaleDateString()}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}