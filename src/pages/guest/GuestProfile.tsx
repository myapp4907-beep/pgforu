import { useState } from "react";
import { useGuestAuth } from "@/hooks/useGuestAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  User, 
  Phone, 
  Mail, 
  Home, 
  Calendar, 
  IndianRupee,
  Edit2,
  Save,
  X,
  UserPlus
} from "lucide-react";
import { format } from "date-fns";

const GuestProfile = () => {
  const { guestProfile, refreshProfile } = useGuestAuth();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editData, setEditData] = useState({
    phone: guestProfile?.phone || "",
    emergency_contact: guestProfile?.emergency_contact || "",
  });

  const handleSave = async () => {
    if (!guestProfile) return;
    
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("guests")
        .update({
          phone: editData.phone,
          emergency_contact: editData.emergency_contact,
        })
        .eq("id", guestProfile.id);

      if (error) throw error;

      toast({ title: "Profile Updated", description: "Your information has been saved." });
      await refreshProfile();
      setIsEditing(false);
    } catch (error: any) {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditData({
      phone: guestProfile?.phone || "",
      emergency_contact: guestProfile?.emergency_contact || "",
    });
    setIsEditing(false);
  };

  if (!guestProfile) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="text-muted-foreground">Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">My Profile</h1>
          <p className="text-muted-foreground">View and manage your information</p>
        </div>
        {!isEditing ? (
          <Button onClick={() => setIsEditing(true)} variant="outline">
            <Edit2 className="h-4 w-4 mr-2" />
            Edit Profile
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button onClick={handleCancel} variant="outline" disabled={isSaving}>
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        )}
      </div>

      {/* Profile Card */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="h-8 w-8 text-primary" />
            </div>
            <div>
              <CardTitle className="text-xl">{guestProfile.full_name}</CardTitle>
              <CardDescription className="flex items-center gap-2 mt-1">
                <Badge variant={guestProfile.status === "active" ? "default" : "secondary"}>
                  {guestProfile.status}
                </Badge>
                <span>•</span>
                <span>{guestProfile.property_name}</span>
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Contact Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Contact Information</CardTitle>
          <CardDescription>Your contact details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-muted-foreground">
                <Mail className="h-4 w-4" />
                Email
              </Label>
              <Input value={guestProfile.email || ""} disabled className="bg-muted/50" />
              <p className="text-xs text-muted-foreground">Email cannot be changed</p>
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-muted-foreground">
                <Phone className="h-4 w-4" />
                Phone Number
              </Label>
              {isEditing ? (
                <Input
                  value={editData.phone}
                  onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                  placeholder="Enter phone number"
                />
              ) : (
                <Input value={guestProfile.phone} disabled className="bg-muted/50" />
              )}
            </div>
          </div>
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-muted-foreground">
              <UserPlus className="h-4 w-4" />
              Emergency Contact
            </Label>
            {isEditing ? (
              <Input
                value={editData.emergency_contact}
                onChange={(e) => setEditData({ ...editData, emergency_contact: e.target.value })}
                placeholder="Enter emergency contact number"
              />
            ) : (
              <Input 
                value={guestProfile.emergency_contact || "Not provided"} 
                disabled 
                className="bg-muted/50" 
              />
            )}
          </div>
        </CardContent>
      </Card>

      {/* Room Details */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Room Details</CardTitle>
          <CardDescription>Your accommodation information</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-lg border border-border/50 bg-muted/30">
              <div className="flex items-center gap-3">
                <Home className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Room Number</p>
                  <p className="font-semibold">{guestProfile.room_number}</p>
                </div>
              </div>
            </div>
            <div className="p-4 rounded-lg border border-border/50 bg-muted/30">
              <div className="flex items-center gap-3">
                <User className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Bed Number</p>
                  <p className="font-semibold">{guestProfile.bed_number || "N/A"}</p>
                </div>
              </div>
            </div>
            <div className="p-4 rounded-lg border border-border/50 bg-muted/30">
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Joining Date</p>
                  <p className="font-semibold">
                    {format(new Date(guestProfile.joining_date), "MMM d, yyyy")}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Rent Details */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Rent Details</CardTitle>
          <CardDescription>Your monthly rent information</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 p-4 rounded-lg border border-border/50 bg-muted/30">
            <div className="p-3 rounded-xl bg-green-500/10">
              <IndianRupee className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Monthly Rent</p>
              <p className="text-2xl font-bold">₹{guestProfile.monthly_rent?.toLocaleString()}</p>
            </div>
            <Badge 
              variant={guestProfile.payment_status === "paid" ? "default" : "destructive"}
              className="ml-auto"
            >
              {guestProfile.payment_status}
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default GuestProfile;
