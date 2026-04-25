import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { C, F } from '../tokens.js'
import RespondNav from '../components/respond/RespondNav.jsx'
import { useRespondent, updateRespondent } from '../lib/useRespondent.js'
import { supabase } from '../lib/supabase.js'

const NIGERIAN_STATES = [
  'Abia','Adamawa','Akwa Ibom','Anambra','Bauchi','Bayelsa','Benue','Borno',
  'Cross River','Delta','Ebonyi','Edo','Ekiti','Enugu','FCT (Abuja)','Gombe',
  'Imo','Jigawa','Kaduna','Kano','Katsina','Kebbi','Kogi','Kwara','Lagos',
  'Nasarawa','Niger','Ogun','Ondo','Osun','Oyo','Plateau','Rivers','Sokoto',
  'Taraba','Yobe','Zamfara'
]

export default function RespondProfilePage({ user }) {
  const navigate = useNavigate()
  const { respondent, earnings, loading, refetch } = useRespondent(user)
  const [form,    setForm]    = useState(null)
  const [saving,  setSaving]  = useState(false)
  const [toast,   setToast]   = useState(null)
  const [tab,     setTab]     = useState('personal')

  useEffect(() => {
    if (respondent) setForm({ ...respondent })
  }, [respondent])

  const showToast = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 4000) }

  const set    = (key, val) => setForm(f => ({ ...f, [key]: val }))
  const toggle = (key, val) => {
    const arr = form?.[key] ?? []
    setForm(f => ({ ...f, [key]: arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val] }))
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await updateRespondent(respondent.id, form)
      await refetch()
      showToast('Profile updated ✓')
    } catch (e) { showToast(e.message, 'error') }
    setSaving(false)
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    navigate('/respond')
  }

  const inp = { width: '100%', padding: '11px 13px', background: C.surface, border: `1px solid ${C.border}`, borderRadius: '10px', color: C.text, fontSize: '14px', fontFamily: F.sans, outline: 'none', boxSizing: 'border-box' }
  const sel = { ...inp, appearance: 'none', cursor: 'pointer' }
  const lbl = { display: 'block', fontSize: '11px', fontWeight: 600, color: C.muted, letterSpacing: '0.3px', marginBottom: '5px', fontFamily: F.sans, textTransform: 'uppercase' }

  const Chip = ({ label, selected, onClick }) => (
    <button onClick={onClick} style={{ padding: '7px 14px', borderRadius: '20px', border: `1px solid ${selected ? C.gold : C.border}`, background: selected ? C.goldDim : 'transparent', color: selected ? C.gold : C.muted, fontSize: '12px', fontFamily: F.sans, cursor: 'pointer', fontWeight: selected ? 600 : 400 }}>
      {label}
    </button>
  )

  if (loading || !form) return <div style={{ minHeight: '100vh', background: C.bg }} />
  if (!respondent) { navigate('/respond/auth'); return null }

  const profileScore = respondent.profile_score ?? 0
  const scoreColor = profileScore >= 80 ? C.green : profileScore >= 50 ? C.gold : '#ef4444'

  const TABS = [
    { key: 'personal',  label: 'Personal'   },
    { key: 'location',  label: 'Location'   },
    { key: 'socioeco',  label: 'Background' },
    { key: 'media',     label: 'Media'      },
    { key: 'account',   label: 'Account'    },
  ]

  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.text, fontFamily: F.sans }}>
      <RespondNav respondent={respondent} earnings={earnings} user={user} />

      {toast && (
        <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 9999, background: toast.type === 'error' ? '#ef4444' : C.green, color: '#fff', padding: '10px 18px', borderRadius: '10px', fontSize: '13px', fontWeight: 500 }}>
          {toast.msg}
        </div>
      )}

      <div style={{ maxWidth: '760px', margin: '0 auto', padding: 'clamp(20px,4vw,40px) clamp(16px,4vw,32px)' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '28px', flexWrap: 'wrap' }}>
          <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: C.goldDim, border: `2px solid ${C.gold}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', fontWeight: 700, color: C.gold, fontFamily: F.display, flexShrink: 0 }}>
            {respondent.avatar_url
              ? <img src={respondent.avatar_url} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
              : (respondent.full_name?.[0] ?? user?.email?.[0] ?? '?').toUpperCase()
            }
          </div>
          <div style={{ flex: 1 }}>
            <h2 style={{ fontSize: 'clamp(18px,3vw,24px)', fontFamily: F.display, fontWeight: 700, marginBottom: '4px' }}>
              {respondent.full_name || 'My Profile'}
            </h2>
            <p style={{ fontSize: '13px', color: C.muted }}>{user?.email}</p>
          </div>

          {/* Profile score */}
          <div style={{ padding: '12px 16px', background: C.card, border: `1px solid ${scoreColor}30`, borderRadius: '12px', textAlign: 'center' }}>
            <p style={{ fontSize: '10px', color: C.muted, fontFamily: F.sans, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Profile Score</p>
            <p style={{ fontSize: '26px', fontWeight: 800, color: scoreColor, fontFamily: F.display, marginBottom: '2px' }}>{profileScore}%</p>
            <div style={{ width: '80px', height: '4px', background: C.border, borderRadius: '2px', overflow: 'hidden' }}>
              <div style={{ width: `${profileScore}%`, height: '100%', background: scoreColor, borderRadius: '2px' }} />
            </div>
            <p style={{ fontSize: '9px', color: C.muted, marginTop: '4px' }}>
              {profileScore >= 80 ? 'Excellent' : profileScore >= 50 ? 'Good' : 'Incomplete'}
            </p>
          </div>
        </div>

        {/* Profile score info */}
        {profileScore < 70 && (
          <div style={{ padding: '12px 16px', background: C.goldDim, border: `1px solid ${C.gold}30`, borderRadius: '10px', marginBottom: '20px', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '16px' }}>💡</span>
            <p style={{ fontSize: '13px', color: C.gold, fontFamily: F.sans, lineHeight: 1.6 }}>
              A complete profile unlocks more surveys. Fill in the missing fields below to increase your score and earn more.
            </p>
          </div>
        )}

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '4px', marginBottom: '24px', background: C.surface, borderRadius: '10px', padding: '4px', overflowX: 'auto' }}>
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)} style={{ flex: 1, padding: '8px 12px', borderRadius: '7px', border: 'none', background: tab === t.key ? C.card : 'transparent', color: tab === t.key ? C.text : C.muted, fontSize: '12px', fontWeight: tab === t.key ? 600 : 400, fontFamily: F.sans, cursor: 'pointer', whiteSpace: 'nowrap' }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Card */}
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '16px', padding: '24px' }}>

          {/* Personal */}
          {tab === 'personal' && (
            <div>
              <h3 style={{ fontSize: '15px', fontFamily: F.display, fontWeight: 700, marginBottom: '18px' }}>Personal Information</h3>
              <label style={lbl}>Full Name</label>
              <input value={form.full_name ?? ''} onChange={e => set('full_name', e.target.value)} placeholder="Your full name" style={{ ...inp, marginBottom: '14px' }} />
              <label style={lbl}>Date of Birth</label>
              <input type="date" value={form.date_of_birth ?? ''} onChange={e => set('date_of_birth', e.target.value)} style={{ ...inp, marginBottom: '14px' }} />
              <label style={lbl}>Gender</label>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {[['male','Male'],['female','Female'],['non_binary','Non-binary'],['prefer_not','Prefer not to say']].map(([v,l]) => (
                  <Chip key={v} label={l} selected={form.gender === v} onClick={() => set('gender', v)} />
                ))}
              </div>
            </div>
          )}

          {/* Location */}
          {tab === 'location' && (
            <div>
              <h3 style={{ fontSize: '15px', fontFamily: F.display, fontWeight: 700, marginBottom: '18px' }}>Location</h3>
              <label style={lbl}>Country</label>
              <select value={form.country ?? 'Nigeria'} onChange={e => set('country', e.target.value)} style={{ ...sel, marginBottom: '14px' }}>
                <option value="Nigeria">Nigeria</option>
                <option value="Ghana">Ghana</option>
                <option value="Kenya">Kenya</option>
                <option value="South Africa">South Africa</option>
                <option value="United Kingdom">United Kingdom</option>
                <option value="United States">United States</option>
                <option value="Other">Other</option>
              </select>
              {form.country === 'Nigeria' && (
                <>
                  <label style={lbl}>State</label>
                  <select value={form.state ?? ''} onChange={e => set('state', e.target.value)} style={{ ...sel, marginBottom: '14px' }}>
                    <option value="">Select state…</option>
                    {NIGERIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </>
              )}
              <label style={lbl}>City / LGA</label>
              <input value={form.lga ?? ''} onChange={e => set('lga', e.target.value)} placeholder="e.g. Victoria Island" style={inp} />
            </div>
          )}

          {/* Socioeconomic */}
          {tab === 'socioeco' && (
            <div>
              <h3 style={{ fontSize: '15px', fontFamily: F.display, fontWeight: 700, marginBottom: '18px' }}>Background</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {[
                  { label: 'Education Level', key: 'education_level', options: [['primary','Primary School'],['secondary','Secondary School'],['tertiary','University / Polytechnic'],['postgraduate','Postgraduate'],['vocational','Vocational']] },
                  { label: 'Employment Status', key: 'employment_status', options: [['employed_full','Employed (Full-time)'],['employed_part','Employed (Part-time)'],['self_employed','Self-employed'],['unemployed','Unemployed'],['student','Student'],['retired','Retired'],['homemaker','Homemaker']] },
                  { label: 'Monthly Income', key: 'monthly_income', options: [['below_50k','Below ₦50,000'],['50k_100k','₦50k–₦100k'],['100k_200k','₦100k–₦200k'],['200k_500k','₦200k–₦500k'],['above_500k','Above ₦500k'],['prefer_not','Prefer not to say']] },
                  { label: 'Marital Status', key: 'marital_status', options: [['single','Single'],['married','Married'],['divorced','Divorced'],['widowed','Widowed']] },
                  { label: 'Housing Type', key: 'housing_type', options: [['rented','Rented'],['owned','Owned'],['family_home','Family Home'],['other','Other']] },
                ].map(field => (
                  <div key={field.key}>
                    <label style={lbl}>{field.label}</label>
                    <select value={form[field.key] ?? ''} onChange={e => set(field.key, e.target.value)} style={sel}>
                      <option value="">Select…</option>
                      {field.options.map(([v,l]) => <option key={v} value={v}>{l}</option>)}
                    </select>
                  </div>
                ))}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={lbl}>Household Size</label>
                    <select value={form.household_size ?? ''} onChange={e => set('household_size', Number(e.target.value))} style={sel}>
                      <option value="">Select…</option>
                      {[1,2,3,4,5,6,7,8].map(n => <option key={n} value={n}>{n === 8 ? '8+' : n}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={lbl}>Number of Children</label>
                    <select value={form.num_children ?? 0} onChange={e => set('num_children', Number(e.target.value))} style={sel}>
                      {[0,1,2,3,4,5].map(n => <option key={n} value={n}>{n === 5 ? '5+' : n}</option>)}
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Media */}
          {tab === 'media' && (
            <div>
              <h3 style={{ fontSize: '15px', fontFamily: F.display, fontWeight: 700, marginBottom: '18px' }}>Media & Consumer Habits</h3>

              <label style={{ ...lbl, marginBottom: '8px' }}>Devices you own</label>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
                {[['smartphone','📱 Smartphone'],['laptop','💻 Laptop'],['tablet','📲 Tablet'],['desktop','🖥️ Desktop'],['smart_tv','📺 Smart TV']].map(([v,l]) => (
                  <Chip key={v} label={l} selected={(form.devices_owned ?? []).includes(v)} onClick={() => toggle('devices_owned', v)} />
                ))}
              </div>

              <label style={{ ...lbl, marginBottom: '8px' }}>Daily internet usage</label>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
                {[['light','< 1 hour'],['moderate','1–3 hours'],['heavy','3–6 hours'],['very_heavy','6+ hours']].map(([v,l]) => (
                  <Chip key={v} label={l} selected={form.internet_usage === v} onClick={() => set('internet_usage', v)} />
                ))}
              </div>

              <label style={{ ...lbl, marginBottom: '8px' }}>Social media platforms</label>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
                {['WhatsApp','Instagram','TikTok','Facebook','YouTube','Twitter/X','LinkedIn','Snapchat'].map(p => {
                  const v = p.toLowerCase().replace(/[^a-z]/g,'_')
                  return <Chip key={v} label={p} selected={(form.social_platforms ?? []).includes(v)} onClick={() => toggle('social_platforms', v)} />
                })}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '16px' }}>
                <div>
                  <label style={{ ...lbl, marginBottom: '8px' }}>TV watching</label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {[['none','None'],['light','Light'],['moderate','Moderate'],['heavy','Heavy']].map(([v,l]) => (
                      <Chip key={v} label={l} selected={form.tv_consumption === v} onClick={() => set('tv_consumption', v)} />
                    ))}
                  </div>
                </div>
                <div>
                  <label style={{ ...lbl, marginBottom: '8px' }}>Radio listening</label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {[['none','None'],['light','Light'],['moderate','Moderate'],['heavy','Heavy']].map(([v,l]) => (
                      <Chip key={v} label={l} selected={form.radio_consumption === v} onClick={() => set('radio_consumption', v)} />
                    ))}
                  </div>
                </div>
              </div>

              <label style={{ ...lbl, marginBottom: '8px' }}>Where do you shop?</label>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {[['online','🛒 Online'],['supermarket','🏪 Supermarket'],['open_market','🏬 Open Market'],['mall','🏢 Mall'],['convenience_store','⛽ Convenience']].map(([v,l]) => (
                  <Chip key={v} label={l} selected={(form.shopping_behaviour ?? []).includes(v)} onClick={() => toggle('shopping_behaviour', v)} />
                ))}
              </div>
            </div>
          )}

          {/* Account */}
          {tab === 'account' && (
            <div>
              <h3 style={{ fontSize: '15px', fontFamily: F.display, fontWeight: 700, marginBottom: '18px' }}>Account Settings</h3>
              <div style={{ padding: '14px 16px', background: C.surface, border: `1px solid ${C.border}`, borderRadius: '10px', marginBottom: '14px' }}>
                <p style={{ fontSize: '11px', color: C.muted, fontFamily: F.sans, fontWeight: 600, marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Email Address</p>
                <p style={{ fontSize: '14px', color: C.text, fontFamily: F.sans }}>{user?.email}</p>
              </div>
              <div style={{ padding: '14px 16px', background: C.surface, border: `1px solid ${C.border}`, borderRadius: '10px', marginBottom: '20px' }}>
                <p style={{ fontSize: '11px', color: C.muted, fontFamily: F.sans, fontWeight: 600, marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Phone Number</p>
                <p style={{ fontSize: '14px', color: form.phone ? C.text : C.dim, fontFamily: F.sans }}>{form.phone ?? 'Not added yet'}</p>
              </div>

              {/* WhatsApp */}
              <a href="https://chat.whatsapp.com/PLACEHOLDER" target="_blank" rel="noopener noreferrer"
                style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px', background: 'rgba(37,211,102,0.08)', border: '1px solid rgba(37,211,102,0.25)', borderRadius: '10px', textDecoration: 'none', marginBottom: '20px' }}>
                <span style={{ fontSize: '22px' }}>💬</span>
                <div>
                  <p style={{ fontSize: '13px', fontWeight: 600, color: '#25D166', fontFamily: F.sans, margin: '0 0 2px' }}>Join our WhatsApp Community</p>
                  <p style={{ fontSize: '11px', color: C.muted, fontFamily: F.sans, margin: 0 }}>Connect with other panel members and stay updated</p>
                </div>
              </a>

              <button onClick={handleSignOut} style={{ width: '100%', padding: '11px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '10px', color: '#ef4444', fontSize: '13px', fontWeight: 600, fontFamily: F.sans, cursor: 'pointer' }}>
                Sign Out
              </button>
            </div>
          )}
        </div>

        {/* Save button — not shown on account tab */}
        {tab !== 'account' && (
          <button onClick={handleSave} disabled={saving} style={{ width: '100%', padding: '13px', background: `linear-gradient(135deg,${C.gold},${C.goldLight})`, border: 'none', borderRadius: '10px', color: C.bg, fontSize: '14px', fontWeight: 700, fontFamily: F.sans, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1, marginTop: '16px' }}>
            {saving ? 'Saving…' : '✓ Save Changes'}
          </button>
        )}
      </div>
    </div>
  )
}
