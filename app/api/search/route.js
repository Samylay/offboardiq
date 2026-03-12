import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth';
import { searchKnowledge } from '@/lib/services/knowledgeSearch';

export async function GET(request) {
  return withAuth(request, async (req, user) => {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q') || '';
    const filters = {
      type: searchParams.get('type'),
      category: searchParams.get('category'),
      department: searchParams.get('department'),
      verified: searchParams.get('verified') ? searchParams.get('verified') === 'true' : undefined,
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '20'),
    };

    const results = await searchKnowledge(user.orgId, query, filters);
    return NextResponse.json(results);
  });
}
