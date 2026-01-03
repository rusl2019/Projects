"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Upload } from "lucide-react";

interface ImportJsonModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (data: any[]) => Promise<void>; // This will call the server action
}

export default function ImportJsonModal({ isOpen, onOpenChange, onImport }: ImportJsonModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (!selectedFile.name.endsWith('.json')) {
        setError('Format file tidak valid. Harap unggah file .json');
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
        const text = e.target?.result as string;
        const jsonData = JSON.parse(text);
        
        setIsParsing(false);
        setIsImporting(true);
        await onImport(jsonData);
        setIsImporting(false);
        onOpenChange(false);
      } catch (err) {
        console.error(err);
        setError('Gagal memproses file. Pastikan format JSON valid.');
        setIsParsing(false);
        setIsImporting(false);
      }
    };
    reader.onerror = () => {
      setError('Gagal membaca file.');
      setIsParsing(false);
    };
    reader.readAsText(file);
  };
  
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
          <DialogTitle>Impor Data dari JSON</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
            <p className="text-sm text-slate-500">
                Pilih file JSON (.json) untuk mengimpor data inventaris. Pastikan struktur data sesuai dengan format hasil backup.
            </p>
            <Input
                id="json-file"
                type="file"
                accept=".json"
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
