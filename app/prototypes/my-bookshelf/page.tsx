'use client';

import { useEffect, useState } from 'react';
import styles from './bookshelf.module.css';
import './bookshelf.global.css';
import { Instrument_Sans } from 'next/font/google';

// Initialize the Instrument Sans font
const instrumentSans = Instrument_Sans({
  subsets: ['latin'],
  display: 'swap',
  weight: ['400', '500', '600', '700'],
});

interface Book {
  id: string;
  title: string;
  author: string;
  genre: string;
  coverImage: string | null;
  rating: number | null;
  review: string | null;
}

export default function MyBookshelfPage() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBooks = async () => {
      try {
        // Fetch books from our server-side API route
        const response = await fetch('/api/books');
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch books');
        }
        
        const data = await response.json();
        setBooks(data.books);
      } catch (err: any) {
        console.error(err);
        setError(err.message || 'Failed to fetch books from Notion. Check console for details and ensure your database is shared with the integration.');
      } finally {
        setLoading(false);
      }
    };

    fetchBooks();
  }, []);

  // Generate star rating display
  const renderStars = (rating: number) => {
    if (rating === 5) return '★★★★★';
    if (rating === 4) return '★★★★☆';
    if (rating === 3) return '★★★☆☆';
    if (rating === 2) return '★★☆☆☆';
    if (rating === 1) return '★☆☆☆☆';
    return '☆☆☆☆☆';
  };

  if (loading) {
    return <div className={styles.loading}>Loading your bookshelf...</div>;
  }

  if (error) {
    return <div className={styles.error}>Error: {error}</div>;
  }

  return (
    <div className={`${styles.container} ${instrumentSans.className}`}>
      {/* Animated background layer */}
      <div className={styles.animatedBg} aria-hidden="true" />
      <header className={styles.header}>
        <h1 className={styles.title}>My bookshelf</h1>
        <div className={styles.bookCount}>{books.length} books</div>
      </header>

      {books.length === 0 && !loading && (
        <div className={styles.emptyState}>
          No books found. Make sure your Notion database is populated and shared correctly with the integration.
        </div>
      )}

      <div className={styles.grid}>
        {books.map((book) => (
          <div key={book.id} className={styles.bookCard}>
            {/* Genre accent bar */}
            <div className={styles.genreBar} />
            <div className={styles.coverContainer}>
              {book.coverImage ? (
                <img 
                  src={book.coverImage} 
                  alt={`Cover of ${book.title}`} 
                  className={styles.coverImage}
                />
              ) : (
                <div className={styles.noCover}>
                  <span role="img" aria-label="book">📚</span>
                </div>
              )}
            </div>
            <h2 className={styles.bookTitle}>{book.title}</h2>
            <p className={styles.bookAuthor}>{book.author}</p>
            
            <div className={styles.rating}>
              <span className={styles.stars}>{book.rating !== null ? renderStars(book.rating) : ''}</span>
            </div>
            
            {book.review && (
              <p className={styles.reviewText}>
                <span>{book.review}</span>
              </p>
            )}
          </div>
        ))}
      </div>
      {/* Floating Action Button */}
      <button className={styles.fab} title="Add Book">
        +
      </button>
    </div>
  );
} 