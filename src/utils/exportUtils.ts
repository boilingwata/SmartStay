/**
 * Utility to export JSON data to a CSV file.
 * Handles escaping and CSV formatting.
 */
export const exportToCSV = (data: any[], fileName: string) => {
  if (!data || !data.length) return;

  const separator = ',';
  const keys = Object.keys(data[0]);
  
  const csvContent = [
    keys.join(separator),
    ...data.map(row => 
      keys.map(key => {
        let cell = row[key] === null || row[key] === undefined ? '' : String(row[key]);
        cell = cell.replace(/"/g, '""');
        if (cell.search(/("|,|\n)/g) >= 0) {
          cell = `"${cell}"`;
        }
        return cell;
      }).join(separator)
    )
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${fileName}_${new Date().toISOString().slice(0, 10)}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
