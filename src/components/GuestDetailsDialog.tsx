import { useState, useEffect } from "react";
import { User, Phone, Calendar, IndianRupee, Edit2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Guest {
  id: string;
  full_name: string;
  phone: string;
  room_id: string | null;
  bed_number: string | null;
  joining_date: string;
  monthly_rent: number;
  payment_status: string;
  status: string;
}

interface GuestDetailsDialogProps {
  guest: Guest;
  rooms: any[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: () => void;
}

export const GuestDetailsDialog = ({ guest, rooms, open, onOpenChange, onUpdate }: GuestDetailsDialogProps) => {
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    full_name: guest.full_name,
    phone: guest.phone,
    room_id: guest.room_id || "",
    bed_number: guest.bed_number || "",
    joining_date: guest.joining_date,
    monthly_rent: guest.monthly_rent.toString(),
    payment_status: guest.payment_status,
    status: guest.status,
  });

  const getRoomNumber = (roomId: string | null) => {
    if (!roomId) return "Not Assigned";
    const room = rooms.find(r => r.id === roomId);
    return room ? room.room_number : "Unknown";
  };

  const handleUpdate = async () => {
    try {
      const { error } = await supabase
        .from("guests")
        .update({
          full_name: editData.full_name,
          phone: editData.phone,
          room_id: editData.room_id || null,
          bed_number: editData.bed_number || null,
          joining_date: editData.joining_date,
          monthly_rent: parseFloat(editData.monthly_rent),
          payment_status: editData.payment_status,
          status: editData.status,
        })
        .eq("id", guest.id);

      if (error) throw error;

      toast({
        title: "Guest Updated",
        description: "Guest details have been updated successfully",
      });

      setIsEditing(false);
      onUpdate();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              {guest.full_name}
            </DialogTitle>
            {!isEditing && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(true)}
              >
                <Edit2 className="h-4 w-4 mr-2" />
                Edit
              </Button>
            )}
          </div>
          <DialogDescription>
            {isEditing ? "Edit guest details" : "View guest details"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {isEditing ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="edit-guest-name">Full Name</Label>
                <Input
                  id="edit-guest-name"
                  value={editData.full_name}
                  onChange={(e) => setEditData({ ...editData, full_name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-guest-phone">Phone Number</Label>
                <Input
                  id="edit-guest-phone"
                  value={editData.phone}
                  onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-guest-room">Room</Label>
                <Select
                  value={editData.room_id}
                  onValueChange={(value) => setEditData({ ...editData, room_id: value })}
                >
                  <SelectTrigger id="edit-guest-room">
                    <SelectValue placeholder="Select a room" />
                  </SelectTrigger>
                  <SelectContent>
                    {rooms.map((room) => (
                      <SelectItem key={room.id} value={room.id}>
                        Room {room.room_number}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-bed-number">Bed Number</Label>
                <Input
                  id="edit-bed-number"
                  value={editData.bed_number}
                  onChange={(e) => setEditData({ ...editData, bed_number: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-joining-date">Joining Date</Label>
                <Input
                  id="edit-joining-date"
                  type="date"
                  value={editData.joining_date}
                  onChange={(e) => setEditData({ ...editData, joining_date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-guest-rent">Monthly Rent (₹)</Label>
                <Input
                  id="edit-guest-rent"
                  type="number"
                  value={editData.monthly_rent}
                  onChange={(e) => setEditData({ ...editData, monthly_rent: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-payment-status">Payment Status</Label>
                <Select
                  value={editData.payment_status}
                  onValueChange={(value) => setEditData({ ...editData, payment_status: value })}
                >
                  <SelectTrigger id="edit-payment-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-status">Status</Label>
                <Select
                  value={editData.status}
                  onValueChange={(value) => setEditData({ ...editData, status: value })}
                >
                  <SelectTrigger id="edit-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="moved_out">Moved Out</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2 pt-4">
                <Button onClick={handleUpdate} className="flex-1">
                  Save Changes
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setIsEditing(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <span className="text-sm text-muted-foreground">Payment Status</span>
                  <Badge variant={guest.payment_status === "paid" ? "default" : "destructive"}>
                    {guest.payment_status === "paid" ? "Paid" : "Pending"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <span className="text-sm text-muted-foreground">Phone</span>
                  <span className="font-medium flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    {guest.phone}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <span className="text-sm text-muted-foreground">Room</span>
                  <span className="font-medium">{getRoomNumber(guest.room_id)}</span>
                </div>
                {guest.bed_number && (
                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <span className="text-sm text-muted-foreground">Bed Number</span>
                    <span className="font-medium">{guest.bed_number}</span>
                  </div>
                )}
                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <span className="text-sm text-muted-foreground">Joining Date</span>
                  <span className="font-medium flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {new Date(guest.joining_date).toLocaleDateString('en-IN')}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <span className="text-sm text-muted-foreground">Monthly Rent</span>
                  <span className="font-medium flex items-center gap-1">
                    <IndianRupee className="h-4 w-4" />
                    {Number(guest.monthly_rent).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
