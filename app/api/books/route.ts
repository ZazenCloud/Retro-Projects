import { Client } from '@notionhq/client';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Initialize the Notion client with server-side environment variables
    const notion = new Client({
      auth: process.env.NOTION_API_KEY,
    });

    const databaseId = process.env.NOTION_DATABASE_ID;

    if (!databaseId) {
      return NextResponse.json(
        { error: 'Database ID not found' },
        { status: 500 }
      );
    }

    // Query the database
    const response = await notion.databases.query({
      database_id: databaseId,
      sorts: [
        {
          property: 'Title',
          direction: 'ascending',
        },
      ],
    });

    // Process the data before sending to client
    const books = response.results.map((page: any) => {
      const properties = page.properties;
      
      // Extract properties safely
      const title = properties.Title?.title?.[0]?.plain_text ?? 'Untitled';
      const author = properties.Author?.rich_text?.[0]?.plain_text ?? 'Unknown Author';
      const genre = properties.Genre?.select?.name ?? 'Uncategorized';
      const coverImage = properties['Cover Image']?.files?.[0]?.file?.url ?? 
                        properties['Cover Image']?.files?.[0]?.external?.url ?? null;
      const rating = properties.Rating?.number ?? null;
      const review = properties.Review?.rich_text?.[0]?.plain_text ?? null;

      return {
        id: page.id,
        title,
        author,
        genre,
        coverImage,
        rating,
        review,
      };
    });

    // Return the processed data
    return NextResponse.json({ books });
  } catch (error: any) {
    console.error('Notion API Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch books from Notion' },
      { status: 500 }
    );
  }
} 