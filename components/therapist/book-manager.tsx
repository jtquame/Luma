"use client";

import { useState, useTransition } from "react";
import { BookForm } from "./book-form";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { deleteBook } from "@/app/(therapist)/books-actions";
import { Plus, Trash2 } from "lucide-react";

interface Book {
  id: string;
  title: string;
  author: string;
  status: string;
  categories: string[];
}

function BookRow({ book }: { book: Book }) {
  const [isPending, startTransition] = useTransition();
  return (
    <Card className="flex items-center justify-between">
      <div>
        <p className="font-medium text-ink">{book.title}</p>
        <p className="text-sm text-ink-muted">
          {book.author} · <span className="capitalize">{book.status}</span>
          {book.categories.length > 0 && ` · ${book.categories.join(", ")}`}
        </p>
      </div>
      <button
        disabled={isPending}
        onClick={() => {
          if (confirm("Remove this book from the library?")) {
            startTransition(() => deleteBook(book.id));
          }
        }}
        className="text-ink-muted hover:text-danger"
        aria-label="Delete book"
      >
        <Trash2 size={17} />
      </button>
    </Card>
  );
}

export function BookManager({ books }: { books: Book[] }) {
  const [showForm, setShowForm] = useState(false);

  return (
    <div>
      <div className="flex items-center justify-end mb-6">
        {!showForm && (
          <Button onClick={() => setShowForm(true)}>
            <Plus size={16} strokeWidth={1.75} />
            Add book
          </Button>
        )}
      </div>

      {showForm && <BookForm onDone={() => setShowForm(false)} />}

      {books.length === 0 ? (
        <p className="text-sm text-ink-muted">No books in the library yet.</p>
      ) : (
        <div className="space-y-3">
          {books.map((b) => (
            <BookRow key={b.id} book={b} />
          ))}
        </div>
      )}
    </div>
  );
}
