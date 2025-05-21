
import { Bell, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import UserMenu from "./UserMenu";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from "@/components/ui/command";
import { useEffect, useRef } from "react";

export default function TopBar() {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const navigationItems = [
    {
      name: "Dashboard",
      path: "/",
      keywords: ["dashboard", "home", "main", "overview"],
    },
    {
      name: "Candidates",
      path: "/users",
      keywords: ["candidates", "users", "people", "applicants", "profiles"],
    },
    {
      name: "Jobs",
      path: "/jobs",
      keywords: ["jobs", "positions", "vacancies", "openings", "careers"],
    },
    {
      name: "Interviews",
      path: "/interview",
      keywords: ["interviews", "meetings", "schedule", "appointments"],
    },
    {
      name: "Resumes",
      path: "/resume",
      keywords: ["resume", "cv", "curriculum", "application"],
    },
    {
      name: "Recent Activity",
      path: "/recent-activity",
      keywords: ["activity", "recent", "updates", "changes", "logs"],
    },
    {
      name: "Candidate Status",
      path: "/candidate-status",
      keywords: ["status", "progress", "pipeline", "tracking"],
    },
  ];

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleSelectItem = (path: string) => {
    setOpen(false);
    navigate(path);
  };

  return (
    <div className="bg-white border-b border-gray-200 py-2 px-4 flex items-center justify-between">
      <div className="flex-1 max-w-md">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
          <Input 
            type="text" 
            placeholder="Search (⌘K)" 
            className="pl-10 pr-4 py-2 border-0 focus-visible:ring-0 focus-visible:ring-offset-0 bg-gray-100"
            onClick={() => setOpen(true)}
            readOnly
          />
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            <div className="h-5 w-5 flex items-center justify-center rounded-sm bg-gray-200">
              <span className="text-xs text-gray-500">⌘K</span>
            </div>
          </div>
        </div>
      </div>
      
      <CommandDialog open={open} onOpenChange={setOpen}>
        <Command>
          <CommandInput 
            placeholder="Type to search..." 
            value={searchQuery} 
            onValueChange={handleSearch} 
            autoFocus
          />
          <CommandEmpty>No results found</CommandEmpty>
          <CommandList>
            <CommandGroup heading="Navigation">
              {navigationItems.map((item) => {
                // Check if search query matches any of the keywords
                const matchesKeyword = item.keywords.some(keyword => 
                  keyword.toLowerCase().includes(searchQuery.toLowerCase())
                );
                
                // Also check if it matches the name
                const matchesName = item.name.toLowerCase().includes(searchQuery.toLowerCase());
                
                // Only show if empty query (show all) or there's a match
                if (searchQuery === "" || matchesKeyword || matchesName) {
                  return (
                    <CommandItem 
                      key={item.path}
                      onSelect={() => handleSelectItem(item.path)}
                    >
                      {item.name}
                    </CommandItem>
                  );
                }
                
                return null;
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </CommandDialog>
      
      <div className="flex items-center space-x-4">
        <button className="p-1 rounded-full hover:bg-gray-100">
          <Bell className="h-5 w-5 text-gray-500" />
        </button>
        <UserMenu />
      </div>
    </div>
  );
}
