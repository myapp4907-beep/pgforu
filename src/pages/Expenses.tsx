import { useState, useEffect } from "react";
import { Plus, IndianRupee, Calendar, TrendingUp, TrendingDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { useAuth } from "@/hooks/useAuth";
import { useProperty } from "@/contexts/PropertyContext";
import { ExportDialog } from "@/components/ExportDialog";

interface Expense {
  id: string;
  expense_type: string;
  amount: number;
  description: string | null;
  expense_date: string;
}

const Expenses = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const { selectedProperty } = useProperty();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [newExpense, setNewExpense] = useState({
    expense_type: "Vegetables",
    amount: "",
    description: "",
    expense_date: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    if (user && selectedProperty) {
      fetchExpenses();
    }
  }, [user, selectedProperty]);

  const fetchExpenses = async () => {
    if (!selectedProperty) return;
    
    try {
      const { data, error } = await supabase
        .from("expenses")
        .select("*")
        .eq("property_id", selectedProperty.id)
        .order("expense_date", { ascending: false });

      if (error) throw error;
      setExpenses(data || []);
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

  const handleAddExpense = async () => {
    if (!newExpense.amount || !newExpense.expense_type || !selectedProperty) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase.from("expenses").insert({
        owner_id: user?.id,
        property_id: selectedProperty.id,
        expense_type: newExpense.expense_type,
        amount: parseFloat(newExpense.amount),
        description: newExpense.description || null,
        expense_date: newExpense.expense_date,
      });

      if (error) throw error;

      toast({
        title: "Expense Added",
        description: "Expense has been recorded successfully",
      });

      setIsAddDialogOpen(false);
      setNewExpense({
        expense_type: "Vegetables",
        amount: "",
        description: "",
        expense_date: new Date().toISOString().split('T')[0],
      });
      fetchExpenses();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const totalExpenses = expenses.reduce((sum, exp) => sum + Number(exp.amount), 0);

  if (loading) {
    return <div className="min-h-screen bg-background flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8 max-w-7xl">
        <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mb-2">Expenses</h1>
            <p className="text-sm sm:text-base text-muted-foreground">Track your monthly expenses</p>
          </div>
          
          <div className="flex gap-2">
            <ExportDialog
              data={expenses.map(e => ({
                expense_type: e.expense_type,
                amount: e.amount,
                description: e.description || '',
                expense_date: new Date(e.expense_date).toLocaleDateString('en-IN'),
              }))}
              filename="expenses_report"
              title="Expenses Report"
              dateField="expense_date"
              csvHeaders={['expense_type', 'amount', 'description', 'expense_date']}
              pdfColumns={[
                { header: 'Type', dataKey: 'expense_type' },
                { header: 'Amount', dataKey: 'amount' },
                { header: 'Description', dataKey: 'description' },
                { header: 'Date', dataKey: 'expense_date' },
              ]}
            />
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2 w-full sm:w-auto">
                  <Plus className="h-4 w-4" />
                  Add Expense
                </Button>
              </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Expense</DialogTitle>
                <DialogDescription>
                  Record a new expense for your PG
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="expense-type">Expense Type</Label>
                  <Select
                    value={newExpense.expense_type}
                    onValueChange={(value) => setNewExpense({ ...newExpense, expense_type: value })}
                  >
                    <SelectTrigger id="expense-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Vegetables">Vegetables</SelectItem>
                      <SelectItem value="Water Bill">Water Bill</SelectItem>
                      <SelectItem value="Electricity Bill">Electricity Bill</SelectItem>
                      <SelectItem value="Gas">Gas</SelectItem>
                      <SelectItem value="Maintenance">Maintenance</SelectItem>
                      <SelectItem value="Groceries">Groceries</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="amount">Amount (₹)</Label>
                  <Input
                    id="amount"
                    type="number"
                    placeholder="e.g., 5000"
                    value={newExpense.amount}
                    onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="expense-date">Date</Label>
                  <Input
                    id="expense-date"
                    type="date"
                    value={newExpense.expense_date}
                    onChange={(e) => setNewExpense({ ...newExpense, expense_date: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description (Optional)</Label>
                  <Input
                    id="description"
                    placeholder="e.g., Monthly water bill"
                    value={newExpense.description}
                    onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
                  />
                </div>
              </div>
              <Button onClick={handleAddExpense} className="w-full">
                Add Expense
              </Button>
            </DialogContent>
          </Dialog>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <TrendingDown className="h-5 w-5 text-destructive" />
                <div>
                  <div className="text-2xl font-bold text-foreground">
                    ₹{totalExpenses.toLocaleString('en-IN')}
                  </div>
                  <p className="text-sm text-muted-foreground">Total Expenses</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                <div>
                  <div className="text-2xl font-bold text-foreground">{expenses.length}</div>
                  <p className="text-sm text-muted-foreground">Total Records</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {expenses.map((expense) => (
            <Card key={expense.id} className="transition-all hover:shadow-md">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center justify-between">
                  <span>{expense.expense_type}</span>
                  <span className="text-destructive font-bold flex items-center">
                    <IndianRupee className="h-4 w-4" />
                    {Number(expense.amount).toLocaleString('en-IN')}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    {new Date(expense.expense_date).toLocaleDateString('en-IN')}
                  </div>
                  {expense.description && (
                    <p className="text-sm text-muted-foreground">{expense.description}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Expenses;
