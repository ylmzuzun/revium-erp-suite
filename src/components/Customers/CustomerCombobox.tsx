import { useState, useEffect } from "react";
import { Check, ChevronsUpDown, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CreateCustomerDialog } from "./CreateCustomerDialog";

interface Customer {
  id: string;
  name: string;
  company: string | null;
  phone: string | null;
  email: string | null;
}

interface CustomerComboboxProps {
  value: string;
  onChange: (customerId: string, customerName: string) => void;
  placeholder?: string;
}

export const CustomerCombobox = ({ value, onChange, placeholder = "Müşteri seçin..." }: CustomerComboboxProps) => {
  const [open, setOpen] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("customers")
        .select("id, name, company, phone, email")
        .order("name");
      
      if (error) throw error;
      setCustomers(data || []);
    } catch (error: any) {
      toast.error("Müşteriler yüklenirken hata: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const selectedCustomer = customers.find(c => c.id === value);

  const filteredCustomers = customers.filter(customer => {
    const search = searchQuery.toLowerCase();
    return (
      customer.name.toLowerCase().includes(search) ||
      customer.company?.toLowerCase().includes(search) ||
      customer.phone?.toLowerCase().includes(search) ||
      customer.email?.toLowerCase().includes(search)
    );
  });

  const handleSelect = (customerId: string) => {
    const customer = customers.find(c => c.id === customerId);
    if (customer) {
      onChange(customerId, customer.name);
      setOpen(false);
    }
  };

  const handleCreateSuccess = () => {
    fetchCustomers();
    setCreateDialogOpen(false);
  };

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
          >
            {selectedCustomer ? (
              <span className="truncate">
                {selectedCustomer.name}
                {selectedCustomer.company && ` - ${selectedCustomer.company}`}
              </span>
            ) : (
              placeholder
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command>
            <CommandInput 
              placeholder="Müşteri ara (ad, şirket, telefon, e-posta)..." 
              value={searchQuery}
              onValueChange={setSearchQuery}
            />
            <CommandList>
              <CommandEmpty>
                <div className="flex flex-col items-center gap-2 py-4">
                  <p className="text-sm text-muted-foreground">Müşteri bulunamadı</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={() => {
                      setOpen(false);
                      setCreateDialogOpen(true);
                    }}
                  >
                    <Plus className="h-4 w-4" />
                    Yeni Müşteri Ekle
                  </Button>
                </div>
              </CommandEmpty>
              <CommandGroup>
                <CommandItem
                  onSelect={() => {
                    setOpen(false);
                    setCreateDialogOpen(true);
                  }}
                  className="flex items-center gap-2 text-primary"
                >
                  <Plus className="h-4 w-4" />
                  <span>Yeni Müşteri Ekle</span>
                </CommandItem>
                {filteredCustomers.map((customer) => (
                  <CommandItem
                    key={customer.id}
                    value={customer.id}
                    onSelect={() => handleSelect(customer.id)}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === customer.id ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <div className="flex flex-col">
                      <span className="font-medium">{customer.name}</span>
                      <div className="flex gap-2 text-xs text-muted-foreground">
                        {customer.company && <span>{customer.company}</span>}
                        {customer.phone && <span>• {customer.phone}</span>}
                        {customer.email && <span>• {customer.email}</span>}
                      </div>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      <CreateCustomerDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSuccess={handleCreateSuccess}
      />
    </>
  );
};
