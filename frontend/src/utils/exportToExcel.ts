import * as xlsx from 'xlsx';

export const exportToExcel = (data: any[], fileName: string, sheetName: string = 'Sheet1') => {
  if (!data || data.length === 0) {
    console.warn("No data available to export.");
    return;
  }

  // Create a new workbook
  const wb = xlsx.utils.book_new();

  // Convert JSON to worksheet
  const ws = xlsx.utils.json_to_sheet(data);

  // Append worksheet to workbook
  xlsx.utils.book_append_sheet(wb, ws, sheetName);

  // Save the file
  xlsx.writeFile(wb, `${fileName}.xlsx`);
};
