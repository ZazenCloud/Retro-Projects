# My Bookshelf Prototype

This prototype displays your book collection from a Notion database in a clean gallery format. It's perfect for keeping track of books you've read, complete with ratings and reviews.

## Setup Instructions

### 1. Create a Notion Integration

1. Go to [https://www.notion.so/my-integrations](https://www.notion.so/my-integrations)
2. Click "New integration"
3. Name your integration (e.g., "My Bookshelf")
4. Select the workspace where your book database is located
5. Under "Capabilities", ensure "Read content" is selected
6. Click "Submit" to create your integration
7. Copy the "Internal Integration Token" (this is your `NOTION_API_KEY`)

### 2. Create a Notion Database

If you don't already have a book database in Notion:

1. Create a new database in Notion with the following properties:
   - Title (Title type) - for book titles
   - Author (Text type)
   - Genre (Select type)
   - Cover Image (Files & media type)
   - Rating (Number type)
   - Review (Text type)
2. Add a few books to your database

### 3. Share Database with Integration

1. Open your book database in Notion
2. Click the "..." menu in the top-right corner
3. Go to "Add connections"
4. Find and select the integration you created in step 1

### 4. Get Your Database ID

1. Open your database in Notion
2. Look at the URL, which will be in this format:
   `https://www.notion.so/{workspace_name}/{database_id}?v={view_id}`
3. Copy the `database_id` part (it's a 32-character string)

### 5. Update the Code

1. Open `app/prototypes/my-bookshelf/page.tsx`
2. Replace `YOUR_NOTION_API_KEY` with your actual Notion API key
3. Replace `YOUR_DATABASE_ID` with your actual database ID

### 6. Install Dependencies

Run the following command to install the required Notion client library:

```bash
npm install @notionhq/client
```

## Customization

You can customize the appearance of the bookshelf by modifying the styles in the `page.tsx` file. The prototype uses inline styles for simplicity, but you can extract these to a separate CSS module if preferred. 