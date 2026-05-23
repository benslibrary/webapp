import { unstable_cache } from "next/cache";
import {
  getBookByIsbn,
  listBooks,
  listRecords,
  listRecordsForBook,
} from "./db/queries";

// Cached wrappers for the read-mostly surfaces. Mutations in
// app/admin/books/actions.ts and app/records/actions.ts call
// revalidateTag() to bust these.
//
// Cache lifetimes:
//   - books catalog: 10 min (catalog only changes when an admin adds/
//     deletes; tag-invalidated on those mutations so the 10 min is just
//     a safety floor)
//   - records lists: 30 s (records are user-generated and many users may
//     write at once; tag-invalidation also fires on each write, so the
//     30 s really only matters for the rare missed revalidate)

export const cachedListBooks = unstable_cache(
  (limit: number) => listBooks({ limit }),
  ["books:list"],
  { revalidate: 600, tags: ["books"] }
);

export const cachedGetBookByIsbn = unstable_cache(
  (isbn: string) => getBookByIsbn(isbn),
  ["books:by-isbn"],
  { revalidate: 600, tags: ["books"] }
);

export const cachedListRecords = unstable_cache(
  (limit: number) => listRecords({ limit }),
  ["records:list"],
  { revalidate: 30, tags: ["records"] }
);

export const cachedListRecordsForBook = unstable_cache(
  (bookId: string) => listRecordsForBook({ bookId }),
  ["records:by-book"],
  { revalidate: 30, tags: ["records"] }
);
