import { NextRequest, NextResponse } from 'next/server';
import { createSSRSassClient } from '@/lib/supabase/server';
import { createServerAdminClient } from '@/lib/supabase/serverAdminClient';

async function isAdmin() {
    const supabase = await createSSRSassClient();
    const client = supabase.getSupabaseClient();
    const { data: { user } } = await client.auth.getUser();
    if (!user) return false;
    const { data } = await client.from('user_roles').select('role').eq('id', user.id).single();
    return data?.role === 'ROLE_ADMIN';
}

export async function GET() {
    if (!(await isAdmin())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const admin = await createServerAdminClient();
    const { data, error } = await admin.auth.admin.listUsers();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const users = await Promise.all(
        data.users.map(async (u) => {
            const { data: roleData } = await admin
                .from('user_roles')
                .select('role')
                .eq('id', u.id)
                .single();
            return { id: u.id, email: u.email, role: roleData?.role ?? 'ROLE_USER' };
        })
    );

    return NextResponse.json({ users });
}

export async function POST(req: NextRequest) {
    if (!(await isAdmin())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    const { email, password, role } = await req.json();
    const admin = await createServerAdminClient();
    const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true });
    if (error || !data.user) return NextResponse.json({ error: error?.message || 'Error' }, { status: 400 });
    await admin.from('user_roles').insert({ id: data.user.id, role: role || 'ROLE_USER' });
    return NextResponse.json({ id: data.user.id });
}

export async function PUT(req: NextRequest) {
    if (!(await isAdmin())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    const { id, role } = await req.json();
    const admin = await createServerAdminClient();
    await admin.from('user_roles').update({ role }).eq('id', id);
    return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest) {
    if (!(await isAdmin())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    const { id } = await req.json();
    const admin = await createServerAdminClient();
    await admin.auth.admin.deleteUser(id);
    return NextResponse.json({ success: true });
}
