import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Check, X, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface User {
  id: string;
  full_name: string;
  email: string;
  department_id: string | null;
}

interface UserMultiSelectProps {
  selectedUsers: string[];
  onSelectionChange: (users: string[]) => void;
}

export const UserMultiSelect = ({ selectedUsers, onSelectionChange }: UserMultiSelectProps) => {
  const [users, setUsers] = useState<User[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, email, department_id");

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error("Kullanıcılar yüklenirken hata:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleUser = (userId: string) => {
    if (selectedUsers.includes(userId)) {
      onSelectionChange(selectedUsers.filter(id => id !== userId));
    } else {
      onSelectionChange([...selectedUsers, userId]);
    }
  };

  const removeUser = (userId: string) => {
    onSelectionChange(selectedUsers.filter(id => id !== userId));
  };

  const getSelectedUserNames = () => {
    return users
      .filter(u => selectedUsers.includes(u.id))
      .map(u => u.full_name);
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" className="w-full justify-start">
            <Users className="mr-2 h-4 w-4" />
            {selectedUsers.length > 0
              ? `${selectedUsers.length} kullanıcı seçildi`
              : "Kullanıcı seçin"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command>
            <CommandInput placeholder="Kullanıcı ara..." />
            <CommandEmpty>Kullanıcı bulunamadı.</CommandEmpty>
            <CommandGroup className="max-h-64 overflow-auto">
              {loading ? (
                <div className="p-4 text-sm text-muted-foreground">Yükleniyor...</div>
              ) : (
                users.map((user) => (
                  <CommandItem
                    key={user.id}
                    onSelect={() => toggleUser(user.id)}
                    className="flex items-center gap-2"
                  >
                    <div
                      className={cn(
                        "flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                        selectedUsers.includes(user.id)
                          ? "bg-primary text-primary-foreground"
                          : "opacity-50"
                      )}
                    >
                      {selectedUsers.includes(user.id) && <Check className="h-3 w-3" />}
                    </div>
                    <Avatar className="h-6 w-6">
                      <AvatarFallback className="text-xs">
                        {getInitials(user.full_name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="text-sm font-medium">{user.full_name}</div>
                      <div className="text-xs text-muted-foreground">{user.email}</div>
                    </div>
                  </CommandItem>
                ))
              )}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>

      {selectedUsers.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {getSelectedUserNames().map((name, index) => (
            <Badge key={selectedUsers[index]} variant="secondary" className="gap-1">
              {name}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => removeUser(selectedUsers[index])}
              />
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
};
