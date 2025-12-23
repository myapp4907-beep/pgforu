import { useState, useEffect } from "react";
import { useGuestAuth } from "@/hooks/useGuestAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  ScrollText, 
  Clock, 
  Users, 
  Volume2, 
  Trash2, 
  Shield,
  Info
} from "lucide-react";

interface PGRule {
  id: string;
  rule_text: string;
  category: string;
  created_at: string;
}

const categoryIcons: Record<string, React.ReactNode> = {
  timing: <Clock className="h-5 w-5" />,
  visitors: <Users className="h-5 w-5" />,
  noise: <Volume2 className="h-5 w-5" />,
  cleanliness: <Trash2 className="h-5 w-5" />,
  security: <Shield className="h-5 w-5" />,
  general: <Info className="h-5 w-5" />,
};

const categoryColors: Record<string, string> = {
  timing: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  visitors: "bg-purple-500/10 text-purple-600 border-purple-500/20",
  noise: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  cleanliness: "bg-green-500/10 text-green-600 border-green-500/20",
  security: "bg-red-500/10 text-red-600 border-red-500/20",
  general: "bg-gray-500/10 text-gray-600 border-gray-500/20",
};

const GuestRules = () => {
  const { guestProfile } = useGuestAuth();
  const [rules, setRules] = useState<PGRule[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (guestProfile) {
      fetchRules();
    }
  }, [guestProfile]);

  const fetchRules = async () => {
    if (!guestProfile) return;

    const { data, error } = await supabase
      .from("pg_rules")
      .select("*")
      .eq("property_id", guestProfile.property_id)
      .order("category", { ascending: true });

    if (data) {
      setRules(data);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Group rules by category
  const groupedRules = rules.reduce((acc, rule) => {
    const category = rule.category || "general";
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(rule);
    return acc;
  }, {} as Record<string, PGRule[]>);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">PG Rules & Guidelines</h1>
        <p className="text-muted-foreground">Important rules for all residents at {guestProfile?.property_name}</p>
      </div>

      {rules.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <ScrollText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No rules have been posted yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Your PG owner will add rules and guidelines here
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedRules).map(([category, categoryRules]) => (
            <Card key={category}>
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${categoryColors[category] || categoryColors.general}`}>
                    {categoryIcons[category] || categoryIcons.general}
                  </div>
                  <div>
                    <CardTitle className="text-lg capitalize">{category}</CardTitle>
                    <CardDescription>{categoryRules.length} rule(s)</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {categoryRules.map((rule, index) => (
                    <li 
                      key={rule.id}
                      className="flex items-start gap-3 p-3 rounded-lg bg-muted/30"
                    >
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary text-sm font-medium flex items-center justify-center">
                        {index + 1}
                      </span>
                      <p className="text-sm leading-relaxed">{rule.rule_text}</p>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Default Rules Info */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="py-6">
          <div className="flex items-start gap-4">
            <div className="p-2 rounded-lg bg-primary/10">
              <Info className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h4 className="font-medium text-primary">General Guidelines</h4>
              <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                <li>• Rent is due by the 5th of every month</li>
                <li>• Maintain cleanliness in common areas</li>
                <li>• Respect quiet hours (10 PM - 7 AM)</li>
                <li>• Report any maintenance issues promptly</li>
                <li>• Follow all rules set by the property owner</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default GuestRules;
