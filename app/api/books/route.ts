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

export async function POST(request: Request) {
  try {
    // Get the form data from the request
    const data = await request.json();
    const { title, author, genre, rating, review, coverImageUrl } = data;

    // Validate required fields
    if (!title) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      );
    }

    // Initialize the Notion client
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

    // Prepare the properties object
    const properties: any = {
      Title: {
        title: [
          {
            text: {
              content: title,
            },
          },
        ],
      },
    };

    // Add optional properties if they exist
    if (author) {
      properties.Author = {
        rich_text: [
          {
            text: {
              content: author,
            },
          },
        ],
      };
    }

    if (genre) {
      properties.Genre = {
        select: {
          name: genre,
        },
      };
    }

    if (rating !== undefined && rating !== null) {
      properties.Rating = {
        number: Number(rating),
      };
    }

    if (review) {
      properties.Review = {
        rich_text: [
          {
            text: {
              content: review,
            },
          },
        ],
      };
    }

    // Handle cover image if provided
    if (coverImageUrl) {
      properties['Cover Image'] = {
        files: [
          {
            name: "Cover Image",
            type: "external",
            external: {
              url: coverImageUrl
            }
          }
        ]
      };
    }

    // Create the page in Notion
    const response = await notion.pages.create({
      parent: {
        database_id: databaseId,
      },
      properties,
    });

    // Return the new book's ID from the response
    return NextResponse.json({ 
      success: true, 
      message: 'Book added successfully',
      id: response.id 
    });
  } catch (error: any) {
    console.error('Notion API Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to add book to Notion' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    // Get the book ID from the URL
    const url = new URL(request.url);
    const bookId = url.searchParams.get('id');

    if (!bookId) {
      return NextResponse.json(
        { error: 'Book ID is required' },
        { status: 400 }
      );
    }

    // Initialize the Notion client
    const notion = new Client({
      auth: process.env.NOTION_API_KEY,
    });

    // Delete the page in Notion (archive it)
    await notion.pages.update({
      page_id: bookId,
      archived: true
    });

    // Return success response
    return NextResponse.json({ 
      success: true, 
      message: 'Book deleted successfully',
      id: bookId 
    });
  } catch (error: any) {
    console.error('Notion API Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete book from Notion' },
      { status: 500 }
    );
  }
} 