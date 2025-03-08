import { User } from "@/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface SearchResultsProps {
  results: (User & { follow_status: string })[];
  onClose?: () => void;
}

export default function SearchResults({ results, onClose }: SearchResultsProps) {
  if (results.length === 0) {
    return <div className="p-4 text-center text-muted-foreground">No results found</div>;
  }

  return (
    <div className="space-y-2">
      {results.map((user) => (
        <Link
          key={user.id}
          href={`/${user.username}`}
          onClick={onClose}
          className="flex items-center justify-between p-2 hover:bg-accent rounded-lg"
        >
          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8">
              <AvatarImage src={user.avatar_url} />
              <AvatarFallback>{user.name[0]}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="text-sm font-medium">{user.name}</span>
              <span className="text-xs text-muted-foreground">@{user.username}</span>
            </div>
          </div>
          <div className="text-xs text-muted-foreground">
            {user.follow_status === 'accepted' && (
              <Button variant="ghost" size="sm" className="h-7">Following</Button>
            )}
          </div>
        </Link>
      ))}
    </div>
  );
}