import { useState } from "react";
import { Download, FileText, Table } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { exportToCSV, exportToPDF, filterDataByDate } from "@/lib/exportUtils";

interface ExportDialogProps {
  data: any[];
  filename: string;
  title: string;
  dateField: string;
  csvHeaders: string[];
  pdfColumns: { header: string; dataKey: string }[];
}

export const ExportDialog = ({
  data,
  filename,
  title,
  dateField,
  csvHeaders,
  pdfColumns,
}: ExportDialogProps) => {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [filterType, setFilterType] = useState<'all' | 'date' | 'month' | 'dateRange' | 'monthRange' | 'year'>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const getFilteredData = () => {
    if (filterType === 'all') return data;
    return filterDataByDate(data, dateField, filterType as any, startDate, endDate);
  };

  const handleExport = (format: 'csv' | 'pdf') => {
    const filteredData = getFilteredData();
    
    if (filteredData.length === 0) {
      toast({
        title: "No Data",
        description: "No records found for the selected filter",
        variant: "destructive",
      });
      return;
    }

    if (format === 'csv') {
      exportToCSV(filteredData, filename, csvHeaders);
    } else {
      exportToPDF(filteredData, filename, title, pdfColumns);
    }

    toast({
      title: "Export Successful",
      description: `${filteredData.length} records exported as ${format.toUpperCase()}`,
    });
    
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Export {title}</DialogTitle>
          <DialogDescription>
            Select filter options and export format
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Filter Type</Label>
            <Select value={filterType} onValueChange={(value: any) => setFilterType(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Records</SelectItem>
                <SelectItem value="date">By Date</SelectItem>
                <SelectItem value="month">By Month</SelectItem>
                <SelectItem value="dateRange">Date Range</SelectItem>
                <SelectItem value="monthRange">Month Range</SelectItem>
                <SelectItem value="year">By Year</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {filterType === 'date' && (
            <div className="space-y-2">
              <Label>Date</Label>
              <Input 
                type="date" 
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
          )}

          {filterType === 'month' && (
            <div className="space-y-2">
              <Label>Month</Label>
              <Input 
                type="month" 
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
          )}

          {filterType === 'dateRange' && (
            <>
              <div className="space-y-2">
                <Label>Start Date</Label>
                <Input 
                  type="date" 
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>End Date</Label>
                <Input 
                  type="date" 
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </>
          )}

          {filterType === 'monthRange' && (
            <>
              <div className="space-y-2">
                <Label>Start Month</Label>
                <Input 
                  type="month" 
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>End Month</Label>
                <Input 
                  type="month" 
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </>
          )}

          {filterType === 'year' && (
            <div className="space-y-2">
              <Label>Year</Label>
              <Input 
                type="number" 
                placeholder="2024"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
          )}

          <div className="flex gap-2 pt-4">
            <Button 
              onClick={() => handleExport('csv')} 
              className="flex-1"
              variant="outline"
            >
              <Table className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
            <Button 
              onClick={() => handleExport('pdf')}
              className="flex-1"
            >
              <FileText className="h-4 w-4 mr-2" />
              Export PDF
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
