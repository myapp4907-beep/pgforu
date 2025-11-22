import { useState } from "react";
import { Plus, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Manager {
  id: string;
  manager_id: string;
  profiles: {
    full_name: string;
    phone: string | null;
  };
}

interface ManagerDialogProps {
  propertyId: string;
  propertyName: string;
}

export const ManagerDialog = ({ propertyId, propertyName }: ManagerDialogProps) => {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [managers, setManagers] = useState<Manager[]>([]);
  const [newManagerEmail, setNewManagerEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchManagers = async () => {
    try {
      const { data: managersData, error } = await supabase
        .from("property_managers")
        .select("id, manager_id")
        .eq("property_id", propertyId);

      if (error) throw error;

      // Fetch profiles for each manager
      if (managersData && managersData.length > 0) {
        const managerIds = managersData.map(m => m.manager_id);
        const { data: profilesData } = await supabase
          .from("profiles")
          .select("id, full_name, phone")
          .in("id", managerIds);

        const managersWithProfiles = managersData.map(manager => ({
          ...manager,
          profiles: profilesData?.find(p => p.id === manager.manager_id) || { full_name: "Unknown", phone: null }
        }));

        setManagers(managersWithProfiles);
      } else {
        setManagers([]);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleAddManager = async () => {
    if (!newManagerEmail.trim()) {
      toast({
        title: "Missing Information",
        description: "Please enter a manager's email",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // First, get the user ID from the email
      const { data: userData, error: userError } = await supabase
        .rpc("get_user_id_by_email", { user_email: newManagerEmail });

      if (userError || !userData) {
        toast({
          title: "User Not Found",
          description: "No user found with this email. They need to sign up first.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      // Add manager role to user_roles (ignore if already exists)
      await supabase
        .from("user_roles")
        .insert([{ user_id: userData, role: "manager" }]);
      
      // Link manager to property
      const { error: linkError } = await supabase
        .from("property_managers")
        .insert([{ property_id: propertyId, manager_id: userData }]);

      if (linkError) throw linkError;

      toast({
        title: "Manager Added",
        description: `${newManagerEmail} has been added as a manager`,
      });

      setNewManagerEmail("");
      fetchManagers();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveManager = async (managerId: string) => {
    try {
      const { error } = await supabase
        .from("property_managers")
        .delete()
        .eq("id", managerId);

      if (error) throw error;

      toast({
        title: "Manager Removed",
        description: "Manager has been removed from this property",
      });

      fetchManagers();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      setIsOpen(open);
      if (open) fetchManagers();
    }}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          Manage Managers
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Manage Managers - {propertyName}</DialogTitle>
          <DialogDescription>
            Add managers who can help you manage this property
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Add Manager Form */}
          <div className="space-y-2">
            <Label htmlFor="manager-email">Manager Email</Label>
            <div className="flex gap-2">
              <Input
                id="manager-email"
                type="email"
                placeholder="manager@example.com"
                value={newManagerEmail}
                onChange={(e) => setNewManagerEmail(e.target.value)}
              />
              <Button onClick={handleAddManager} disabled={loading}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Current Managers */}
          <div className="space-y-2">
            <Label>Current Managers</Label>
            {managers.length === 0 ? (
              <p className="text-sm text-muted-foreground">No managers assigned yet</p>
            ) : (
              <div className="space-y-2">
                {managers.map((manager) => (
                  <Card key={manager.id}>
                    <CardContent className="flex items-center justify-between p-3">
                      <div>
                        <p className="font-medium">{manager.profiles.full_name}</p>
                        {manager.profiles.phone && (
                          <p className="text-sm text-muted-foreground">{manager.profiles.phone}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">Manager</Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveManager(manager.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
