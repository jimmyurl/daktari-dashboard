export default function SetupPage() {
  return (
    <div className="max-w-2xl space-y-5">
      <div>
        <h1 className="text-2xl font-extrabold">Setup Guide</h1>
        <p className="text-gray-400 text-sm mt-0.5">Get everything running</p>
      </div>

      {[
        {
          step: '1', title: 'Run the Database Schema',
          desc: 'Go to Supabase → SQL Editor → paste supabase/schema.sql → Run',
          code: `-- Creates all daktari.* tables (safe to run multiple times)
-- File: daktari_full/supabase/schema.sql`,
          note: '✅ Uses CREATE TABLE IF NOT EXISTS — safe on existing databases'
        },
        {
          step: '2', title: 'Create Admin Users Table',
          desc: 'Run admin_users.sql to create the independent admin login system',
          code: `-- Run admin_users.sql in Supabase SQL Editor
-- This creates daktari.admin_users table and your first admin:
select daktari.create_admin_user('Jimmy', 'jpmpanga@gmail.com', 'REDACTED', 'super_admin');`,
          note: '💡 This is completely separate from app patients/users'
        },
        {
          step: '3', title: 'Set .env Credentials',
          desc: 'Get your anon key from Supabase → Settings → API (the eyJ... JWT key)',
          code: `# daktari-admin/.env
VITE_SUPABASE_URL=https://jwseypmwlcnyxabfaqmd.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`,
          note: '⚠️ Use the "anon public" key starting with eyJ — NOT sb_publishable_'
        },
        {
          step: '4', title: 'Flutter App — Set .env',
          desc: 'Create .env in daktari_full/ folder (next to pubspec.yaml)',
          code: `# daktari_full/.env
SUPABASE_URL=https://jwseypmwlcnyxabfaqmd.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Then run:
flutter run --dart-define-from-file=.env`,
          note: '📱 Users sign up with email/password — no phone OTP needed yet'
        },
        {
          step: '5', title: 'Enable Phone SMS (Optional)',
          desc: 'For OTP phone login in the Flutter app',
          code: `-- Supabase → Authentication → Providers → Phone → Enable
-- SMS Provider: Twilio
-- Get free credentials at: twilio.com/try-twilio
-- Add your Twilio Account SID + Auth Token`,
          note: '📞 Twilio free trial works for testing. Africa\'s Talking not available in Supabase.'
        },
      ].map(({ step, title, desc, code, note }) => (
        <div key={step} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-start gap-4">
            <div className="w-8 h-8 rounded-xl text-white font-extrabold text-sm
              flex items-center justify-center flex-shrink-0" style={{ background:'#0D5C4A' }}>
              {step}
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-gray-900">{title}</h3>
              <p className="text-sm text-gray-500 mt-1 mb-3 leading-relaxed">{desc}</p>
              <pre className="bg-gray-900 text-green-400 text-xs p-4 rounded-xl overflow-x-auto
                leading-relaxed font-mono whitespace-pre-wrap">{code}</pre>
              {note && (
                <p className="text-xs text-gray-400 mt-2 bg-gray-50 px-3 py-2 rounded-lg">{note}</p>
              )}
            </div>
          </div>
        </div>
      ))}

      <div className="bg-green-50 border border-green-200 rounded-2xl p-5">
        <div className="flex items-start gap-3">
          <span className="text-2xl">✅</span>
          <div>
            <h3 className="font-bold text-green-800">All done?</h3>
            <p className="text-sm text-green-700 mt-1 leading-relaxed">
              Patients from the Flutter app will appear in the Patients tab automatically.
              Add more admins from the Admin Users page without touching auth.users.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
