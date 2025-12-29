"use client";

import { useState } from "react";
import * as XLSX from 'xlsx';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Upload } from "lucide-react";

interface ImportExcelModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (data: any[]) => Promise<void>; // This will call the server action
}

export default function ImportExcelModal({ isOpen, onOpenChange, onImport }: ImportExcelModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Basic validation for file type
      if (!selectedFile.name.endsWith('.xlsx') && !selectedFile.name.endsWith('.xls')) {
        setError('Format file tidak valid. Harap unggah file .xlsx atau .xls');
        setFile(null);
        return;
      }
      setFile(selectedFile);
      setError(null);
    }
  };

  const handleImportClick = () => {
    if (!file) {
      setError('Harap pilih file untuk diimpor.');
      return;
    }

    setIsParsing(true);
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        
        setIsParsing(false);
        setIsImporting(true);
        await onImport(jsonData); // Call the server action passed via props
        setIsImporting(false);
        onOpenChange(false); // Close modal on success
      } catch (err) {
        console.error(err);
        setError('Gagal memproses file. Pastikan formatnya benar.');
        setIsParsing(false);
        setIsImporting(false);
      }
    };
    reader.onerror = () => {
      setError('Gagal membaca file.');
      setIsParsing(false);
    };
    reader.readAsArrayBuffer(file);
  };
  
  // Reset state when modal is closed
  const handleModalOpenChange = (open: boolean) => {
      if (!open) {
          setFile(null);
          setError(null);
          setIsParsing(false);
          setIsImporting(false);
      }
      onOpenChange(open);
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleModalOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Impor Data dari Excel</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
            <p className="text-sm text-slate-500">
                Pilih file Excel (.xlsx atau .xls) untuk mengimpor data inventaris. Pastikan kolom sesuai dengan template hasil ekspor.
            </p>
            <Input
                id="excel-file"
                type="file"
                accept=".xlsx, .xls"
                onChange={handleFileChange}
                disabled={isParsing || isImporting}
            />
            {file && <p className="text-xs text-slate-600">File terpilih: <strong>{file.name}</strong></p>}
            {error && <p className="text-sm text-red-500">{error}</p>}
        </div>
        <DialogFooter>
            <DialogClose asChild>
                <Button variant="outline" disabled={isImporting}>Batal</Button>
            </DialogClose>
            <Button onClick={handleImportClick} disabled={!file || isParsing || isImporting}>
                {(isParsing || isImporting) ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                    <Upload className="mr-2 h-4 w-4" />
                )}
                {isParsing ? 'Memproses...' : isImporting ? 'Mengimpor...' : 'Mulai Impor'}
            </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
