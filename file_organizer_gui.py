# file_organizer_gui.py

import os
import shutil
import tkinter as tk
from tkinter import filedialog, messagebox

# Mendefinisikan ekstensi file dan direktori tujuan
file_extensions = {
    "Documents": [".pdf", ".doc", ".docx", ".txt", ".rtf"],
    "Images": [".jpg", ".jpeg", ".png", ".gif", ".bmp", ".svg"],
    "Videos": [".mp4", ".avi", ".mkv", ".mov", ".wmv"],
    "Music": [".mp3", ".wav", ".flac", ".aac", ".ogg"],
    "Archives": [".zip", ".rar", ".7z", ".tar", ".gz"],
    "Programs": [".exe", ".msi", ".bat", ".sh", ".app"],
    "HTML": [".html", ".htm"],
    "CSS": [".css"],
    "JavaScript": [".js"],
    "Python": [".py"],
    "Java": [".java"],
    "C++": [".cpp", ".h"],
    "C#": [".cs"],
    "PHP": [".php"],
    "Ruby": [".rb"],
    "Swift": [".swift"],
    "Go": [".go"],
    "Kotlin": [".kt"],
    "Rust": [".rs"],
    "TypeScript": [".ts"],
    "SQL": [".sql"],
    "XML": [".xml"],
    "JSON": [".json"],
    "YAML": [".yaml", ".yml"],
}


def organize_files(directory):
    summary = {}
    for item in os.listdir(directory):
        item_path = os.path.join(directory, item)
        if os.path.isfile(item_path):
            file_extension = os.path.splitext(item)[1].lower()
            for dest_dir, extensions in file_extensions.items():
                if file_extension in extensions:
                    destination_path = os.path.join(directory, dest_dir, item)
                    if not os.path.exists(os.path.join(directory, dest_dir)):
                        os.mkdir(os.path.join(directory, dest_dir))
                    if os.path.exists(destination_path):
                        file_name, file_ext = os.path.splitext(item)
                        counter = 1
                        while os.path.exists(destination_path):
                            new_file_name = f"{file_name}_{counter}{file_ext}"
                            destination_path = os.path.join(
                                directory, dest_dir, new_file_name
                            )
                            counter += 1
                    shutil.move(item_path, destination_path)
                    if dest_dir not in summary:
                        summary[dest_dir] = []
                    summary[dest_dir].append(item)
                    break
        elif os.path.isdir(item_path):
            organize_files(item_path)
    return summary


def browse_directory():
    directory = filedialog.askdirectory()
    if directory:
        directory_entry.delete(0, tk.END)
        directory_entry.insert(tk.END, directory)


def start_organizing():
    directory = directory_entry.get()
    if directory:
        summary = organize_files(directory)
        summary_text = "File organization completed.\n\nSummary:\n"
        for dest_dir, files in summary.items():
            summary_text += f"\nMoved to {dest_dir}:\n"
            for file in files:
                summary_text += f"- {file}\n"
        messagebox.showinfo("File Organizer", summary_text)
    else:
        messagebox.showerror("File Organizer", "Please select a directory.")


# Membuat jendela utama
window = tk.Tk()
window.title("File Organizer")

# Membuat label dan entry untuk direktori
directory_label = tk.Label(window, text="Directory:")
directory_label.pack()
directory_entry = tk.Entry(window, width=50)
directory_entry.pack()

# Membuat tombol browse
browse_button = tk.Button(window, text="Browse", command=browse_directory)
browse_button.pack()

# Membuat tombol start
start_button = tk.Button(window, text="Start Organizing", command=start_organizing)
start_button.pack()

# Menjalankan aplikasi
window.mainloop()
