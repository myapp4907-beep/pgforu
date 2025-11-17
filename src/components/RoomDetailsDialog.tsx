import { useState } from "react";
import { BedDouble, Users, IndianRupee, Edit2 } from "lucide-react";
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

interface Room {
  id: string;
  room_number: string;
  room_type: string;
  monthly_rent: number;
  status: string;
  current_guests?: number;
  max_occupancy: number;
}

interface RoomDetailsDialogProps {
  room: Room;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: () => void;
}

export const RoomDetailsDialog = ({ room, open, onOpenChange, onUpdate }: RoomDetailsDialogProps) => {
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    room_number: room.room_number,
    room_type: room.room_type,
    monthly_rent: room.monthly_rent.toString(),
    max_occupancy: room.max_occupancy.toString(),
    status: room.status,
  });

  const handleUpdate = async () => {
    try {
      const { error } = await supabase
        .from("rooms")
        .update({
          room_number: editData.room_number,
          room_type: editData.room_type,
          monthly_rent: parseFloat(editData.monthly_rent),
          max_occupancy: parseInt(editData.max_occupancy),
          status: editData.status,
        })
        .eq("id", room.id);

      if (error) throw error;

      toast({
        title: "Room Updated",
        description: "Room details have been updated successfully",
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
              <BedDouble className="h-5 w-5 text-primary" />
              Room {room.room_number}
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
            {isEditing ? "Edit room details" : "View room details"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {isEditing ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="edit-room-number">Room Number</Label>
                <Input
                  id="edit-room-number"
                  value={editData.room_number}
                  onChange={(e) => setEditData({ ...editData, room_number: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-room-type">Room Type</Label>
                <Select
                  value={editData.room_type}
                  onValueChange={(value) => setEditData({ ...editData, room_type: value })}
                >
                  <SelectTrigger id="edit-room-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Single">Single</SelectItem>
                    <SelectItem value="Double">Double</SelectItem>
                    <SelectItem value="Sharing">Sharing</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-room-rent">Monthly Rent (₹)</Label>
                <Input
                  id="edit-room-rent"
                  type="number"
                  value={editData.monthly_rent}
                  onChange={(e) => setEditData({ ...editData, monthly_rent: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-max-occupancy">Max Occupancy</Label>
                <Select
                  value={editData.max_occupancy}
                  onValueChange={(value) => setEditData({ ...editData, max_occupancy: value })}
                >
                  <SelectTrigger id="edit-max-occupancy">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 Person</SelectItem>
                    <SelectItem value="2">2 People</SelectItem>
                    <SelectItem value="3">3 People</SelectItem>
                    <SelectItem value="4">4 People</SelectItem>
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
                    <SelectItem value="vacant">Vacant</SelectItem>
                    <SelectItem value="occupied">Occupied</SelectItem>
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
                  <span className="text-sm text-muted-foreground">Status</span>
                  <Badge variant={room.status === "occupied" ? "default" : "secondary"}>
                    {room.status === "occupied" ? "Occupied" : "Vacant"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <span className="text-sm text-muted-foreground">Type</span>
                  <span className="font-medium">{room.room_type}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <span className="text-sm text-muted-foreground">Monthly Rent</span>
                  <span className="font-medium flex items-center gap-1">
                    <IndianRupee className="h-4 w-4" />
                    {Number(room.monthly_rent).toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <span className="text-sm text-muted-foreground">Max Occupancy</span>
                  <span className="font-medium flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    {room.max_occupancy} {room.max_occupancy === 1 ? "Person" : "People"}
                  </span>
                </div>
                {room.status === "occupied" && (
                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <span className="text-sm text-muted-foreground">Current Occupancy</span>
                    <span className="font-medium">
                      {room.current_guests}/{room.max_occupancy}
                    </span>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
