import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get('url');

    if (!url) {
      return NextResponse.json(
        { error: 'URL parameter is required' },
        { status: 400 }
      );
    }

    // Validate that it's an Instagram media URL
    if (!url.includes('instagram.com') && !url.includes('cdninstagram.com')) {
      return NextResponse.json(
        { error: 'Invalid media URL' },
        { status: 400 }
      );
    }

    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': '*/*',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate',
        'Connection': 'keep-alive',
      },
      responseType: 'arraybuffer',
      timeout: 30000,
    });

    // Get content type from response headers
    const contentType = response.headers['content-type'] || 'application/octet-stream';
    
    // Create response with proper headers
    return new NextResponse(response.data, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': 'attachment',
        'Cache-Control': 'public, max-age=3600',
      },
    });

  } catch (error) {
    console.error('Error downloading media:', error);
    return NextResponse.json(
      { error: 'Failed to download media' },
      { status: 500 }
    );
  }
}
