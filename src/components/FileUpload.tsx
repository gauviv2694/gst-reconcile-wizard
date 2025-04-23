
import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import * as XLSX from 'xlsx';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Upload } from "lucide-react";

interface FileUploadProps {
  fileType: 'gstr2b' | 'purchaseRegister';
  label: string;
  onFileLoaded: (data: any[], headers: string[]) => void;
}

export function FileUpload({ fileType, label, onFileLoaded }: FileUploadProps) {
  const [previewData, setPreviewData] = useState<any[] | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  const onDrop = useCallback((acceptedFiles: File[]) => {
    setError(null);
    
    if (acceptedFiles.length === 0) {
      return;
    }
    
    const file = acceptedFiles[0];
    
    // Check file type
    if (!file.name.match(/\.(xlsx|xls|csv)$/i)) {
      setError('Please upload an Excel (.xlsx, .xls) or CSV file');
      return;
    }
    
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'array' });
        
        // Take the first sheet
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        // Convert to JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        
        // Extract headers (column names)
        const headers = Object.keys(jsonData[0] || {});
        
        setPreviewData(jsonData.slice(0, 5)); // Preview first 5 rows
        setHeaders(headers);
        
        onFileLoaded(jsonData, headers);
      } catch (err) {
        console.error('Error parsing file:', err);
        setError('Failed to parse the Excel file. Please check the format.');
      }
    };
    
    reader.readAsArrayBuffer(file);
  }, [onFileLoaded]);
  
  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop,
    accept: {
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'text/csv': ['.csv']
    }
  });
  
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">{label}</h3>
      
      <div 
        {...getRootProps()} 
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
          ${isDragActive ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center justify-center space-y-2">
          <Upload className="h-10 w-10 text-muted-foreground" />
          {isDragActive ? (
            <p className="text-sm text-muted-foreground">Drop the file here...</p>
          ) : (
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Drag & drop an Excel file here, or click to select</p>
              <p className="text-xs text-muted-foreground">Supports: .xlsx, .xls, .csv</p>
            </div>
          )}
          <Button variant="outline" size="sm">
            Browse Files
          </Button>
        </div>
      </div>
      
      {error && (
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {previewData && previewData.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <h4 className="text-sm font-medium mb-2">File Preview (First 5 rows)</h4>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    {headers.slice(0, 5).map((header, index) => (
                      <TableHead key={index}>{header}</TableHead>
                    ))}
                    {headers.length > 5 && (
                      <TableHead>...</TableHead>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {previewData.map((row, rowIndex) => (
                    <TableRow key={rowIndex}>
                      {headers.slice(0, 5).map((header, cellIndex) => (
                        <TableCell key={cellIndex}>
                          {String(row[header] || '')}
                        </TableCell>
                      ))}
                      {headers.length > 5 && (
                        <TableCell>...</TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {headers.length > 5 ? `+ ${headers.length - 5} more columns` : ''}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
