import { NextRequest, NextResponse } from 'next/server';

const templates = {
  users: {
    headers: ['email', 'name', 'ecitizen_id', 'role'],
    rows: [
      ['john.doe@example.com', 'John Doe', 'EC123456', 'user'],
      ['jane.admin@example.com', 'Jane Admin', 'EC789012', 'admin'],
      ['user@example.com', 'Sample User', 'EC345678', 'user']
    ]
  },
  ecosystems: {
    headers: ['name', 'theme', 'description', 'active_status'],
    rows: [
      ['Marketing Team', 'Business', 'Social media accounts for marketing department', 'true'],
      ['Support Team', 'Technology', 'Customer support social media presence', 'true'],
      ['Sales Region A', 'Finance', 'Regional sales team social accounts', 'false']
    ]
  },
  'user-assignments': {
    headers: ['user_email', 'ecosystem_name', 'assigned_by_email'],
    rows: [
      ['john.doe@example.com', 'Marketing Team', 'jane.admin@example.com'],
      ['john.doe@example.com', 'Support Team', 'jane.admin@example.com'],
      ['user@example.com', 'Sales Region A', 'jane.admin@example.com']
    ]
  }
};

export async function GET(request: NextRequest) {
  try {
    // Check if user is admin
    const sessionRes = await fetch(new URL('/api/auth/session', request.url), {
      headers: {
        cookie: request.headers.get('cookie') || '',
      },
    });
    
    if (!sessionRes.ok) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const session = await sessionRes.json();
    
    if (!session.user || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Only admin users can download templates' },
        { status: 403 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type') as keyof typeof templates;

    if (!type || !templates[type]) {
      return NextResponse.json(
        { error: 'Invalid template type' },
        { status: 400 }
      );
    }

    const template = templates[type];
    
    // Generate CSV content
    let csvContent = template.headers.join(',') + '\n';
    template.rows.forEach(row => {
      csvContent += row.map(cell => {
        // Escape quotes and wrap in quotes if contains comma or quotes
        const escaped = cell.replace(/"/g, '""');
        return cell.includes(',') || cell.includes('"') ? `"${escaped}"` : escaped;
      }).join(',') + '\n';
    });

    // Return CSV file
    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${type}_template.csv"`,
      },
    });
  } catch (error) {
    console.error('Error generating template:', error);
    return NextResponse.json(
      { error: 'Failed to generate template' },
      { status: 500 }
    );
  }
}