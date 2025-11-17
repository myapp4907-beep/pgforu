import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const exportToCSV = (data: any[], filename: string, headers: string[]) => {
  const csvContent = [
    headers.join(','),
    ...data.map(row => headers.map(header => {
      const value = row[header] || '';
      // Escape commas and quotes
      return typeof value === 'string' && (value.includes(',') || value.includes('"'))
        ? `"${value.replace(/"/g, '""')}"`
        : value;
    }).join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
  link.click();
};

export const exportToPDF = (data: any[], filename: string, title: string, columns: any[]) => {
  const doc = new jsPDF();
  
  doc.setFontSize(16);
  doc.text(title, 14, 15);
  
  doc.setFontSize(10);
  doc.text(`Generated on: ${new Date().toLocaleDateString('en-IN')}`, 14, 22);

  const tableData = data.map(row => columns.map(col => row[col.dataKey] || ''));

  autoTable(doc, {
    head: [columns.map(col => col.header)],
    body: tableData,
    startY: 28,
    styles: { fontSize: 9 },
    headStyles: { fillColor: [99, 102, 241] },
  });

  doc.save(`${filename}_${new Date().toISOString().split('T')[0]}.pdf`);
};

export const filterDataByDate = (
  data: any[],
  dateField: string,
  filterType: 'date' | 'month' | 'dateRange' | 'monthRange' | 'year',
  startDate?: string,
  endDate?: string
) => {
  return data.filter(item => {
    const itemDate = new Date(item[dateField]);
    
    switch (filterType) {
      case 'date':
        if (!startDate) return true;
        return itemDate.toISOString().split('T')[0] === startDate;
      
      case 'month':
        if (!startDate) return true;
        const [year, month] = startDate.split('-');
        return itemDate.getFullYear() === parseInt(year) && 
               itemDate.getMonth() === parseInt(month) - 1;
      
      case 'dateRange':
        if (!startDate || !endDate) return true;
        const start = new Date(startDate);
        const end = new Date(endDate);
        return itemDate >= start && itemDate <= end;
      
      case 'monthRange':
        if (!startDate || !endDate) return true;
        const [startYear, startMonth] = startDate.split('-');
        const [endYear, endMonth] = endDate.split('-');
        const startMonthDate = new Date(parseInt(startYear), parseInt(startMonth) - 1, 1);
        const endMonthDate = new Date(parseInt(endYear), parseInt(endMonth), 0);
        return itemDate >= startMonthDate && itemDate <= endMonthDate;
      
      case 'year':
        if (!startDate) return true;
        return itemDate.getFullYear() === parseInt(startDate);
      
      default:
        return true;
    }
  });
};
