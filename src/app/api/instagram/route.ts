import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import * as cheerio from 'cheerio';

interface InstagramMedia {
  type: 'image' | 'video';
  url: string;
  thumbnail?: string;
}

interface GraphQLNode {
  is_video: boolean;
  video_url?: string;
  display_url: string;
}

interface GraphQLEdge {
  node: GraphQLNode;
}

interface GraphQLData {
  edge_sidecar_to_children?: {
    edges: GraphQLEdge[];
  };
  is_video: boolean;
  video_url?: string;
  display_url: string;
  edge_media_to_caption?: {
    edges: Array<{
      node: {
        text: string;
      };
    }>;
  };
  owner?: {
    username: string;
  };
}

interface JSONLDData {
  '@type': string;
  contentUrl?: string;
  caption?: string;
  author?: {
    alternateName: string;
  };
}

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      );
    }

    // Validate Instagram URL - support all formats:
    // https://www.instagram.com/p/ABC123/
    // https://www.instagram.com/username/p/ABC123/
    // https://www.instagram.com/reel/ABC123/
    // https://www.instagram.com/username/reel/ABC123/
    // https://www.instagram.com/tv/ABC123/
    // https://www.instagram.com/username/tv/ABC123/
    // https://instagram.com/p/ABC123/ (without www)
    // With or without trailing slash and query parameters
    const instagramUrlRegex = /^https?:\/\/(www\.)?instagram\.com\/([A-Za-z0-9_.]+\/)?(p|reel|tv)\/[A-Za-z0-9_-]+\/?(\?.*)?$/;
    if (!instagramUrlRegex.test(url)) {
      return NextResponse.json(
        { error: 'Invalid Instagram URL. Supported formats: posts (/p/), reels (/reel/), and IGTV (/tv/)' },
        { status: 400 }
      );
    }

    // Add ?__a=1 to get JSON response from Instagram
    const jsonUrl = url.includes('?') ? `${url}&__a=1` : `${url}?__a=1`;
    
    try {
      // Try to get JSON data first
      const response = await axios.get(jsonUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate, br',
          'Connection': 'keep-alive',
          'Sec-Fetch-Dest': 'document',
          'Sec-Fetch-Mode': 'navigate',
          'Sec-Fetch-Site': 'none',
          'Upgrade-Insecure-Requests': '1',
        },
        timeout: 15000,
        maxRedirects: 5,
      });

      if (response.data && response.data.graphql) {
        const postData = response.data.graphql.shortcode_media;
        return extractMediaFromGraphQL(postData);
      }
    } catch {
      console.log('JSON method failed, trying HTML scraping...');
    }

    // Fallback to HTML scraping
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Upgrade-Insecure-Requests': '1',
      },
      timeout: 15000,
      maxRedirects: 5,
    });

    const $ = cheerio.load(response.data);
    
    // Try to extract from script tags containing JSON data
    const scriptTags = $('script[type="application/ld+json"]');
    let postData: JSONLDData | null = null;

    scriptTags.each((_, element) => {
      try {
        const jsonData = JSON.parse($(element).html() || '') as JSONLDData;
        if (jsonData && jsonData['@type'] === 'ImageObject') {
          postData = jsonData;
          return false; // break the loop
        }
      } catch {
        // Continue to next script tag
      }
    });

    if (postData !== null) {
      const media: InstagramMedia[] = [];
      const validPostData = postData as JSONLDData;

      if (validPostData.contentUrl) {
        media.push({
          type: 'image',
          url: validPostData.contentUrl
        });
      }

      return NextResponse.json({
        media,
        caption: validPostData.caption || '',
        username: validPostData.author?.alternateName || ''
      });
    }

    // Try to extract from meta tags
    const ogImage = $('meta[property="og:image"]').attr('content');
    const ogVideo = $('meta[property="og:video"]').attr('content');
    
    const media: InstagramMedia[] = [];
    
    if (ogVideo) {
      media.push({
        type: 'video',
        url: ogVideo,
        thumbnail: ogImage
      });
    } else if (ogImage) {
      media.push({
        type: 'image',
        url: ogImage
      });
    }

    if (media.length === 0) {
      return NextResponse.json(
        { error: 'Could not extract media from Instagram post' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      media,
      caption: $('meta[property="og:description"]').attr('content') || '',
      username: ''
    });

  } catch (error) {
    console.error('Error processing Instagram URL:', error);
    return NextResponse.json(
      { error: 'Failed to process Instagram URL' },
      { status: 500 }
    );
  }
}

function extractMediaFromGraphQL(postData: GraphQLData): NextResponse {
  const media: InstagramMedia[] = [];
  
  if (postData.edge_sidecar_to_children) {
    // Multiple media post
    postData.edge_sidecar_to_children.edges.forEach((edge: GraphQLEdge) => {
      const node = edge.node;
      if (node.is_video && node.video_url) {
        media.push({
          type: 'video',
          url: node.video_url,
          thumbnail: node.display_url
        });
      } else {
        media.push({
          type: 'image',
          url: node.display_url
        });
      }
    });
  } else {
    // Single media post
    if (postData.is_video && postData.video_url) {
      media.push({
        type: 'video',
        url: postData.video_url,
        thumbnail: postData.display_url
      });
    } else {
      media.push({
        type: 'image',
        url: postData.display_url
      });
    }
  }

  return NextResponse.json({
    media,
    caption: postData.edge_media_to_caption?.edges[0]?.node?.text || '',
    username: postData.owner?.username || ''
  });
}
