
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Download, Check, AlertTriangle, Plus, Minus } from 'lucide-react';
import { MatchResult, generateMismatchSummary } from '@/utils/reconciliationUtils';
import { generateReconciliationWorkbook, downloadWorkbook } from '@/utils/excelUtils';

interface ReconciliationResultsProps {
  results: MatchResult | null;
  mappedFields: Record<string, string>;
  isLoading: boolean;
}

export function ReconciliationResults({ 
  results, 
  mappedFields,
  isLoading 
}: ReconciliationResultsProps) {
  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6 flex justify-center items-center h-40">
          <div className="flex flex-col items-center gap-2">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            <p className="text-sm text-muted-foreground">Processing data...</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (!results) {
    return null;
  }
  
  const { common, moreInGstr2b, lessInGstr2b } = results;
  
  const handleDownload = () => {
    const workbook = generateReconciliationWorkbook(results, mappedFields, {
      includeHeaders: true,
      highlightMismatches: true,
      autoWidth: true,
      freezeHeader: true
    });
    
    downloadWorkbook(workbook, 'gst-reconciliation-report.xlsx');
  };
  
  const getTotalMismatchCount = () => {
    return common.filter(entry => entry.mismatches.length > 0).length;
  };
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Reconciliation Results</h2>
        <Button onClick={handleDownload} className="flex items-center gap-2">
          <Download className="h-4 w-4" />
          Download Excel Report
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gst-matched/10 border-gst-matched">
          <CardContent className="p-4 flex justify-between items-center">
            <div>
              <p className="text-sm font-medium">Common Entries</p>
              <p className="text-2xl font-bold">{common.length}</p>
            </div>
            <Check className="h-8 w-8 text-gst-matched" />
          </CardContent>
        </Card>
        
        <Card className="bg-gst-more/10 border-gst-more">
          <CardContent className="p-4 flex justify-between items-center">
            <div>
              <p className="text-sm font-medium">Only in GSTR-2B</p>
              <p className="text-2xl font-bold">{moreInGstr2b.length}</p>
            </div>
            <Plus className="h-8 w-8 text-gst-more" />
          </CardContent>
        </Card>
        
        <Card className="bg-gst-less/10 border-gst-less">
          <CardContent className="p-4 flex justify-between items-center">
            <div>
              <p className="text-sm font-medium">Only in Purchase Register</p>
              <p className="text-2xl font-bold">{lessInGstr2b.length}</p>
            </div>
            <Minus className="h-8 w-8 text-gst-less" />
          </CardContent>
        </Card>
      </div>
      
      {getTotalMismatchCount() > 0 && (
        <Card className="bg-gst-mismatch/10 border-gst-mismatch">
          <CardContent className="p-4 flex justify-between items-center">
            <div>
              <p className="text-sm font-medium">Entries with Field Mismatches</p>
              <p className="text-2xl font-bold">{getTotalMismatchCount()}</p>
            </div>
            <AlertTriangle className="h-8 w-8 text-gst-mismatch" />
          </CardContent>
        </Card>
      )}
      
      <Tabs defaultValue="common" className="w-full">
        <TabsList className="w-full grid grid-cols-3">
          <TabsTrigger value="common">
            <span className="flex items-center gap-2">
              <Check className="h-4 w-4" />
              Common Entries
            </span>
          </TabsTrigger>
          <TabsTrigger value="more">
            <span className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Only in GSTR-2B
            </span>
          </TabsTrigger>
          <TabsTrigger value="less">
            <span className="flex items-center gap-2">
              <Minus className="h-4 w-4" />
              Only in Purchase Register
            </span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="common">
          {common.length > 0 ? (
            <div className="rounded-md border overflow-hidden">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Status</TableHead>
                      {Object.keys(common[0].gstr2b).slice(0, 5).map((header) => (
                        <TableHead key={`gstr2b-${header}`}>
                          GSTR-2B: {header}
                        </TableHead>
                      ))}
                      <TableHead>Mismatch Summary</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {common.map((entry, index) => (
                      <TableRow key={index} className={entry.mismatches.length > 0 ? 'bg-gst-mismatch/10' : ''}>
                        <TableCell>
                          {entry.mismatches.length > 0 ? (
                            <Badge variant="outline" className="bg-gst-mismatch/20 text-gst-mismatch border-gst-mismatch">
                              Mismatch
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-gst-matched/20 text-gst-matched border-gst-matched">
                              Matched
                            </Badge>
                          )}
                        </TableCell>
                        {Object.entries(entry.gstr2b).slice(0, 5).map(([key, value], keyIndex) => (
                          <TableCell key={keyIndex}>
                            {String(value)}
                          </TableCell>
                        ))}
                        <TableCell className={entry.mismatches.length > 0 ? 'text-gst-mismatch' : ''}>
                          {entry.mismatches.length > 0 
                            ? generateMismatchSummary(entry.mismatches) 
                            : "All fields match"
                          }
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No common entries found between GSTR-2B and Purchase Register
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="more">
          {moreInGstr2b.length > 0 ? (
            <div className="rounded-md border overflow-hidden">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {Object.keys(moreInGstr2b[0]).slice(0, 6).map((header) => (
                        <TableHead key={header}>{header}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {moreInGstr2b.map((entry, index) => (
                      <TableRow key={index}>
                        {Object.entries(entry).slice(0, 6).map(([key, value], keyIndex) => (
                          <TableCell key={keyIndex}>
                            {String(value)}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No entries found only in GSTR-2B
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="less">
          {lessInGstr2b.length > 0 ? (
            <div className="rounded-md border overflow-hidden">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {Object.keys(lessInGstr2b[0]).slice(0, 6).map((header) => (
                        <TableHead key={header}>{header}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lessInGstr2b.map((entry, index) => (
                      <TableRow key={index}>
                        {Object.entries(entry).slice(0, 6).map(([key, value], keyIndex) => (
                          <TableCell key={keyIndex}>
                            {String(value)}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No entries found only in Purchase Register
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
