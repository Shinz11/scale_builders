import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(
  supabaseUrl,
  supabaseServiceRoleKey
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    console.error('Missing Supabase environment variables');
    return res.status(500).json({ error: 'Server configuration error' });
  }

  try {
    const body = req.body;

    if (!body.system_id || !Array.isArray(body.notes) || body.notes.length === 0) {
      return res.status(400).json({ error: 'Invalid payload' });
    }

    const hasInvalidNote = body.notes.some(note => (
      typeof note !== 'object' ||
      note === null ||
      typeof note.index !== 'number' ||
      typeof note.cent !== 'number' ||
      typeof note.frequency !== 'number' ||
      typeof note.isBase !== 'boolean'
    ));

    if (hasInvalidNote) {
      return res.status(400).json({ error: 'Invalid notes format' });
    }

    const { data, error } = await supabase
      .from('scale_submissions')
      .insert({
        participant_code: body.participant_code ?? null,
        session_id: body.session_id ?? null,
        system_id: body.system_id,
        system_name: body.system_name ?? null,
        base_frequency: body.base_frequency ?? 261.63,
        notes_json: body.notes,
        raw_ui_json: body.raw_ui_data ?? null
      })
      .select('id')
      .single();

    if (error) {
      console.error(error);
      return res.status(500).json({ error: 'Supabase insert failed' });
    }

    return res.status(200).json({
      ok: true,
      submission_id: data.id
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
}
