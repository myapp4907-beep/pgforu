import { useState, useEffect } from "react";
import { Bell, X, Calendar, Home } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useProperty } from "@/contexts/PropertyContext";
import { format, addDays, startOfMonth, endOfMonth } from "date-fns";

interface Notification {
  id: string;
  type: "rent_due" | "vacant_room";
  title: string;
  message: string;
  priority: "high" | "medium" | "low";
}

export const NotificationsPanel = () => {
  const { user } = useAuth();
  const { selectedProperty } = useProperty();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && selectedProperty) {
      fetchNotifications();
    }
  }, [user, selectedProperty]);

  const fetchNotifications = async () => {
    if (!selectedProperty) return;

    try {
      const currentMonth = format(new Date(), "yyyy-MM-01");
      const startDate = startOfMonth(new Date());
      const endDate = endOfMonth(new Date());

      const [guestsRes, paymentsRes, roomsRes] = await Promise.all([
        supabase
          .from("guests")
          .select("id, full_name, monthly_rent, bed_number, rooms(room_number)")
          .eq("property_id", selectedProperty.id)
          .eq("status", "active"),
        supabase
          .from("payments")
          .select("guest_id")
          .eq("property_id", selectedProperty.id)
          .eq("payment_month", currentMonth),
        supabase
          .from("rooms")
          .select("id, room_number, status")
          .eq("property_id", selectedProperty.id)
          .eq("status", "vacant"),
      ]);

      if (guestsRes.error) throw guestsRes.error;
      if (paymentsRes.error) throw paymentsRes.error;
      if (roomsRes.error) throw roomsRes.error;

      const guests = guestsRes.data || [];
      const paidGuestIds = new Set((paymentsRes.data || []).map(p => p.guest_id));
      const vacantRooms = roomsRes.data || [];

      const newNotifications: Notification[] = [];

      // Check for unpaid rent
      guests.forEach((guest) => {
        if (!paidGuestIds.has(guest.id)) {
          newNotifications.push({
            id: `rent-${guest.id}`,
            type: "rent_due",
            title: "Rent Payment Pending",
            message: `${guest.full_name} (Room ${guest.rooms?.room_number}${guest.bed_number ? `, Bed ${guest.bed_number}` : ""}) - ₹${guest.monthly_rent.toLocaleString('en-IN')} due for ${format(new Date(), "MMMM")}`,
            priority: "high",
          });
        }
      });

      // Check for vacant rooms
      vacantRooms.forEach((room) => {
        newNotifications.push({
          id: `vacant-${room.id}`,
          type: "vacant_room",
          title: "Vacant Room",
          message: `Room ${room.room_number} is currently vacant and available`,
          priority: "medium",
        });
      });

      setNotifications(newNotifications);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-destructive text-destructive-foreground";
      case "medium":
        return "bg-warning text-warning-foreground";
      case "low":
        return "bg-info text-info-foreground";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "rent_due":
        return <Calendar className="h-4 w-4" />;
      case "vacant_room":
        return <Home className="h-4 w-4" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  return (
    <div className="relative">
      <Button
        variant="outline"
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        className="relative"
      >
        <Bell className="h-5 w-5" />
        {notifications.length > 0 && (
          <Badge 
            className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-destructive text-destructive-foreground"
          >
            {notifications.length}
          </Badge>
        )}
      </Button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <Card className="absolute right-0 top-12 w-96 max-h-[80vh] overflow-y-auto z-50 shadow-lg">
            <div className="sticky top-0 bg-card border-b p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-primary" />
                <h3 className="font-semibold text-foreground">Notifications</h3>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <CardContent className="p-0">
              {loading ? (
                <div className="p-8 text-center text-muted-foreground">
                  Loading notifications...
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  <Bell className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No notifications</p>
                  <p className="text-sm">All caught up!</p>
                </div>
              ) : (
                <div className="divide-y">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className="p-4 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex gap-3">
                        <div className={`${getPriorityColor(notification.priority)} p-2 rounded-full h-fit`}>
                          {getIcon(notification.type)}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-sm text-foreground mb-1">
                            {notification.title}
                          </h4>
                          <p className="text-xs text-muted-foreground">
                            {notification.message}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};
