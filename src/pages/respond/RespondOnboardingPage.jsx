import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { C, F } from '../tokens.js'
import { updateRespondent } from '../lib/useRespondent.js'
import { supabase } from '../lib/supabase.js'

const NIGERIAN_STATES = [
  'Abia','Adamawa','Akwa Ibom','Anambra','Bauchi','Bayelsa','Benue','Borno',
  'Cross River','Delta','Ebonyi','Edo','Ekiti','Enugu','FCT (Abuja)','Gombe',
  'Imo','Jigawa','Kaduna','Kano','Katsina','Kebbi','Kogi','Kwara','Lagos',
  'Nasarawa','Niger','Ogun','Ondo','Osun','Oyo','Plateau','Rivers','Sokoto',
  'Taraba','Yobe','Zamfara'
]

const STEPS = [
  { id: 'personal',  label: 'Personal',    icon: '👤' },
  { id: 'location',  label: 'Location',    icon: '📍' },
  { id: 'socioeco',  label: 'Background',  icon: '🏠' },
  { id: 'media',     label: 'Media',       icon: '📱' },
  { id: 'done',      label: 'Done',        icon: '🎉' },
]

export default function RespondOnboardingPage() {
  const navigate = useNavigate()
  const [step,    setStep]    = useState(0)
  const [saving,  setSaving]  = useState(false)
  const [error,   setError]   = useState(null)
  const [form,    setForm]    = useState({
    full_name: '', date_of_birth: '', gender: '',
    state: '', lga: '', country: 'Nigeria',
    education_level: '', employment_status: '', monthly_income: '',
    household_size: '', marital_status: '', num_children: 0, housing_type: '',
    devices_owned: [], internet_usage: '', social_platforms: [],
    tv_consumption: '', radio_consumption: '', shopping_behaviour: [],
  })

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }))
  const toggle = (key, val) => {
    const arr = form[key] ?? []
    setForm(f => ({ ...f, [key]: arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val] }))
  }

  const inp = { width: '100%', padding: '11px 13px', background: C.surface, border: `1px solid ${C.border}`, borderRadius: '10px', color: C.text, fontSize: '14px', fontFamily: F.sans, outline: 'none', boxSizing: 'border-box' }
  const sel = { ...inp, appearance: 'none', cursor: 'pointer' }
  const lbl = { display: 'block', fontSize: '12px', fontWeight: 600, color: C.muted, letterSpacing: '0.3px', marginBottom: '6px', fontFamily: F.sans }

  const Chip = ({ label, selected, onClick }) => (
    <button onClick={onClick} style={{ padding: '7px 14px', borderRadius: '20px', border: `1px solid ${selected ? C.gold : C.border}`, background: selected ? C.goldDim : 'transparent', color: selected ? C.gold : C.muted, fontSize: '12px', fontFamily: F.sans, cursor: 'pointer', fontWeight: selected ? 600 : 400, transition: 'all 0.15s' }}>
      {label}
    </button>
  )

  const handleNext = async () => {
    setError(null)
    if (step < STEPS.length - 2) { setStep(s => s + 1); return }

    // Final step — save profile
    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      const { data: respondent } = await supabase.from('respondents').select('id').eq('user_id', user.id).single()
      await updateRespondent(respondent.id, {
        ...form,
        household_size: Number(form.household_size) || null,
        num_children:   Number(form.num_children)   || 0,
        onboarding_done: true,
      })
      setStep(STEPS.length - 1)
    } catch (e) { setError(e.message) }
    setSaving(false)
  }

  const progress = ((step) / (STEPS.length - 1)) * 100

  return (
    <div style={{ minHeight: '100vh', background: C.bg, fontFamily: F.sans, color: C.text, padding: '24px 16px' }}>
      <div style={{ maxWidth: '580px', margin: '0 auto' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <h2 style={{ fontSize: '22px', fontFamily: F.display, fontWeight: 700, marginBottom: '6px' }}>Complete Your Profile</h2>
          <p style={{ fontSize: '13px', color: C.muted }}>Help us match you to the right surveys. Takes about 3 minutes.</p>
        </div>

        {/* Step indicator */}
        <div style={{ display: 'flex', gap: '6px', marginBottom: '8px' }}>
          {STEPS.map((s, i) => (
            <div key={s.id} style={{ flex: 1, height: '4px', borderRadius: '2px', background: i <= step ? C.gold : C.border, transition: 'all 0.3s' }} />
          ))}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '28px' }}>
          <span style={{ fontSize: '12px', color: C.muted, fontFamily: F.sans }}>Step {step + 1} of {STEPS.length}</span>
          <span style={{ fontSize: '12px', color: C.gold, fontFamily: F.sans, fontWeight: 600 }}>{STEPS[step]?.icon} {STEPS[step]?.label}</span>
        </div>

        {/* Card */}
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '16px', padding: '28px' }}>

          {error && <div style={{ padding: '10px 14px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', marginBottom: '16px', fontSize: '13px', color: '#ef4444' }}>{error}</div>}

          {/* Step 0: Personal */}
          {step === 0 && (
            <div>
              <h3 style={{ fontSize: '16px', fontFamily: F.display, fontWeight: 700, marginBottom: '20px' }}>Personal Information</h3>
              <label style={lbl}>Full Name *</label>
              <input value={form.full_name} onChange={e => set('full_name', e.target.value)} placeholder="Your full name" style={{ ...inp, marginBottom: '14px' }} />
              <label style={lbl}>Date of Birth *</label>
              <input type="date" value={form.date_of_birth} onChange={e => set('date_of_birth', e.target.value)} style={{ ...inp, marginBottom: '14px' }} />
              <label style={lbl}>Gender *</label>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {[['male','Male'],['female','Female'],['non_binary','Non-binary'],['prefer_not','Prefer not to say']].map(([v,l]) => (
                  <Chip key={v} label={l} selected={form.gender === v} onClick={() => set('gender', v)} />
                ))}
              </div>
            </div>
          )}

          {/* Step 1: Location */}
          {step === 1 && (
            <div>
              <h3 style={{ fontSize: '16px', fontFamily: F.display, fontWeight: 700, marginBottom: '20px' }}>Where are you based?</h3>
              <label style={lbl}>Country</label>
              <select value={form.country} onChange={e => set('country', e.target.value)} style={{ ...sel, marginBottom: '14px' }}>
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
                  <label style={lbl}>State *</label>
                  <select value={form.state} onChange={e => set('state', e.target.value)} style={{ ...sel, marginBottom: '14px' }}>
                    <option value="">Select state…</option>
                    {NIGERIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </>
              )}
              <label style={lbl}>City / LGA</label>
              <input value={form.lga} onChange={e => set('lga', e.target.value)} placeholder="e.g. Victoria Island" style={{ ...inp }} />
            </div>
          )}

          {/* Step 2: Socioeconomic */}
          {step === 2 && (
            <div>
              <h3 style={{ fontSize: '16px', fontFamily: F.display, fontWeight: 700, marginBottom: '20px' }}>Background</h3>
              <label style={lbl}>Education Level</label>
              <select value={form.education_level} onChange={e => set('education_level', e.target.value)} style={{ ...sel, marginBottom: '14px' }}>
                <option value="">Select…</option>
                <option value="primary">Primary School</option>
                <option value="secondary">Secondary School (WAEC/NECO)</option>
                <option value="tertiary">University / Polytechnic</option>
                <option value="postgraduate">Postgraduate</option>
                <option value="vocational">Vocational / Trade School</option>
              </select>
              <label style={lbl}>Employment Status</label>
              <select value={form.employment_status} onChange={e => set('employment_status', e.target.value)} style={{ ...sel, marginBottom: '14px' }}>
                <option value="">Select…</option>
                <option value="employed_full">Employed (Full-time)</option>
                <option value="employed_part">Employed (Part-time)</option>
                <option value="self_employed">Self-employed / Business owner</option>
                <option value="unemployed">Unemployed / Job seeking</option>
                <option value="student">Student</option>
                <option value="retired">Retired</option>
                <option value="homemaker">Homemaker</option>
              </select>
              <label style={lbl}>Monthly Income (Naira)</label>
              <select value={form.monthly_income} onChange={e => set('monthly_income', e.target.value)} style={{ ...sel, marginBottom: '14px' }}>
                <option value="">Select bracket…</option>
                <option value="below_50k">Below ₦50,000</option>
                <option value="50k_100k">₦50,000 – ₦100,000</option>
                <option value="100k_200k">₦100,000 – ₦200,000</option>
                <option value="200k_500k">₦200,000 – ₦500,000</option>
                <option value="above_500k">Above ₦500,000</option>
                <option value="prefer_not">Prefer not to say</option>
              </select>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                <div>
                  <label style={lbl}>Marital Status</label>
                  <select value={form.marital_status} onChange={e => set('marital_status', e.target.value)} style={sel}>
                    <option value="">Select…</option>
                    <option value="single">Single</option>
                    <option value="married">Married</option>
                    <option value="divorced">Divorced</option>
                    <option value="widowed">Widowed</option>
                  </select>
                </div>
                <div>
                  <label style={lbl}>Number of Children</label>
                  <select value={form.num_children} onChange={e => set('num_children', e.target.value)} style={sel}>
                    {[0,1,2,3,4,5].map(n => <option key={n} value={n}>{n === 5 ? '5+' : n}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={lbl}>Household Size</label>
                  <select value={form.household_size} onChange={e => set('household_size', e.target.value)} style={sel}>
                    <option value="">Select…</option>
                    {[1,2,3,4,5,6,7,8].map(n => <option key={n} value={n}>{n === 8 ? '8+' : n}</option>)}
                  </select>
                </div>
                <div>
                  <label style={lbl}>Housing Type</label>
                  <select value={form.housing_type} onChange={e => set('housing_type', e.target.value)} style={sel}>
                    <option value="">Select…</option>
                    <option value="rented">Rented</option>
                    <option value="owned">Owned</option>
                    <option value="family_home">Family home</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Media & Consumer behaviour */}
          {step === 3 && (
            <div>
              <h3 style={{ fontSize: '16px', fontFamily: F.display, fontWeight: 700, marginBottom: '20px' }}>Media & Consumer Habits</h3>

              <label style={{ ...lbl, marginBottom: '8px' }}>Devices you own (select all)</label>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
                {[['smartphone','📱 Smartphone'],['laptop','💻 Laptop'],['tablet','📲 Tablet'],['desktop','🖥️ Desktop'],['smart_tv','📺 Smart TV']].map(([v,l]) => (
                  <Chip key={v} label={l} selected={form.devices_owned.includes(v)} onClick={() => toggle('devices_owned', v)} />
                ))}
              </div>

              <label style={{ ...lbl, marginBottom: '8px' }}>Daily internet usage</label>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
                {[['light','< 1 hour'],['moderate','1–3 hours'],['heavy','3–6 hours'],['very_heavy','6+ hours']].map(([v,l]) => (
                  <Chip key={v} label={l} selected={form.internet_usage === v} onClick={() => set('internet_usage', v)} />
                ))}
              </div>

              <label style={{ ...lbl, marginBottom: '8px' }}>Social media platforms (select all you use)</label>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
                {['WhatsApp','Instagram','TikTok','Facebook','YouTube','Twitter/X','LinkedIn','Snapchat'].map(p => {
                  const v = p.toLowerCase().replace(/[^a-z]/g,'_')
                  return <Chip key={v} label={p} selected={form.social_platforms.includes(v)} onClick={() => toggle('social_platforms', v)} />
                })}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
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

              <label style={{ ...lbl, marginBottom: '8px' }}>Where do you shop? (select all)</label>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {[['online','🛒 Online'],['supermarket','🏪 Supermarket'],['open_market','🏬 Open Market'],['mall','🏢 Mall'],['convenience_store','⛽ Convenience Store']].map(([v,l]) => (
                  <Chip key={v} label={l} selected={form.shopping_behaviour.includes(v)} onClick={() => toggle('shopping_behaviour', v)} />
                ))}
              </div>
            </div>
          )}

          {/* Step 4: Done */}
          {step === STEPS.length - 1 && (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{ fontSize: '56px', marginBottom: '16px' }}>🎉</div>
              <h3 style={{ fontSize: '20px', fontFamily: F.display, fontWeight: 700, marginBottom: '10px' }}>You're all set!</h3>
              <p style={{ fontSize: '14px', color: C.muted, lineHeight: 1.7, marginBottom: '24px' }}>
                Your profile is complete. We'll match you to surveys that fit your background. Earn ₦1,000 for each one you complete.
              </p>
              {/* WhatsApp CTA */}
              <a href="https://chat.whatsapp.com/PLACEHOLDER" target="_blank" rel="noopener noreferrer"
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', padding: '12px', background: 'rgba(37,211,102,0.1)', border: '1px solid rgba(37,211,102,0.3)', borderRadius: '10px', textDecoration: 'none', marginBottom: '16px' }}>
                <span style={{ fontSize: '20px' }}>💬</span>
                <span style={{ fontSize: '13px', color: '#25D166', fontWeight: 600, fontFamily: F.sans }}>Join our WhatsApp Community for Respondents</span>
              </a>
              <button onClick={() => navigate('/respond/dashboard')} style={{ width: '100%', padding: '12px', background: `linear-gradient(135deg,${C.gold},${C.goldLight})`, border: 'none', borderRadius: '10px', color: C.bg, fontSize: '14px', fontWeight: 700, fontFamily: F.sans, cursor: 'pointer' }}>
                View Available Surveys →
              </button>
            </div>
          )}
        </div>

        {/* Navigation buttons */}
        {step < STEPS.length - 1 && (
          <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
            {step > 0 && (
              <button onClick={() => setStep(s => s - 1)} style={{ padding: '11px 20px', background: C.surface, border: `1px solid ${C.border}`, borderRadius: '10px', color: C.muted, fontSize: '13px', fontFamily: F.sans, cursor: 'pointer' }}>
                ← Back
              </button>
            )}
            <button onClick={handleNext} disabled={saving} style={{ flex: 1, padding: '12px', background: `linear-gradient(135deg,${C.gold},${C.goldLight})`, border: 'none', borderRadius: '10px', color: C.bg, fontSize: '14px', fontWeight: 700, fontFamily: F.sans, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}>
              {saving ? 'Saving…' : step === STEPS.length - 2 ? 'Complete Profile ✓' : 'Continue →'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
