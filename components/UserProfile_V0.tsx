import { Wallet } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface UserProfileProps {
  user: {
    name: string
    username: string
    walletAddress: string
    profilePic: string
    balance: {
      ETH: number
      USDC: number
    }
  }
}

export default function UserProfile({ user }: UserProfileProps) {
  return (
    <div className="flex items-center space-x-4 bg-gradient-to-r from-purple-400 to-pink-500 p-4 rounded-lg shadow-lg">
      <Avatar className="h-20 w-20 border-2 border-white">
        <AvatarImage src={user.profilePic} alt={user.name} />
        <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
      </Avatar>
      <div className="flex-1 text-white">
        <h2 className="text-2xl font-bold">{user.name}</h2>
        <p className="text-sm opacity-75">{user.username}</p>
        <p className="text-sm opacity-75">{user.walletAddress}</p>
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="secondary" size="sm">
            <Wallet className="mr-2 h-4 w-4" />
            Balance
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuLabel>Your Balance</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem>
            <span className="mr-2">ETH:</span>
            <span>{user.balance.ETH}</span>
          </DropdownMenuItem>
          <DropdownMenuItem>
            <span className="mr-2">USDC:</span>
            <span>{user.balance.USDC}</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

