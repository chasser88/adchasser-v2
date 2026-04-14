import { useState, useRef, useEffect } from 'react'
import { C, F } from '../tokens.js'
import { GEOGRAPHY, getRegions } from '../lib/geography.js'

// Pan Nigeria = all Nigerian regions
export const PAN_NIGERIA = getRegions('Nigeria').map(r => ({ country: 'Nigeria', region: r }))

// Default coverage for new campaigns
export const DEFAULT_COVERAGE = PAN_NIGERIA

export default function CoverageSelector({ value = [], onChange }) {
  const [open,               setOpen]               = useState(false)
  const [selectedContinent,  setSelectedContinent]  = useState('Africa')
  const [selectedCountry,    setSelectedCountry]    = useState('Nigeria')
  const [regionSearch,       setRegionSearch]       = useState('')
  const ref = useRef()

  useEffect(() => {
    const handleClick = (e) => { if (!ref.current?.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const isPanNigeria = () => {
    const nigeriaRegions = getRegions('Nigeria')
    const selectedNigeria = value.filter(v => v.country === 'Nigeria').map(v => v.region)
    return nigeriaRegions.length === selectedNigeria.length &&
      nigeriaRegions.every(r => selectedNigeria.includes(r))
  }

  const toggleRegion = (country, region) => {
    const exists = value.find(v => v.country === country && v.region === region)
    if (exists) {
      onChange(value.filter(v => !(v.country === country && v.region === region)))
    } else {
      onChange([...value, { country, region }])
    }
  }

  const toggleCountryAll = (country) => {
    const regions    = getRegions(country)
    const allSelected = regions.every(r => value.find(v => v.country === country && v.region === r))
    if (allSelected) {
      onChange(value.filter(v => v.country !== country))
    } else {
      const existing = value.filter(v => v.country !== country)
      onChange([...existing, ...regions.map(r => ({ country, region: r }))])
    }
  }

  const removeCountry = (country) => onChange(value.filter(v => v.country !== country))

  // Grouped display
  const grouped = value.reduce((acc, item) => {
    if (!acc[item.country]) acc[item.country] = []
    acc[item.country].push(item.region)
    return acc
  }, {})

  const continents = Object.keys(GEOGRAPHY)
  const countries  = selectedContinent ? Object.keys(GEOGRAPHY[selectedContinent]) : []
  const regions    = selectedCountry
    ? getRegions(selectedCountry).filter(r => r.toLowerCase().includes(regionSearch.toLowerCase()))
    : []

  const inp = {
    width: '100%', background: C.bg, border: `1px solid ${C.border}`, borderRadius: '8px',
    padding: '7px 10px', color: C.text, fontSize: '12px', fontFamily: F.sans, outline: 'none', boxSizing: 'border-box',
  }

  // Build display label
  const getDisplayLabel = () => {
    if (value.length === 0) return 'Select countries & regions…'
    const nigeriaOnly = Object.keys(grouped).length === 1 && grouped['Nigeria']
    if (nigeriaOnly && isPanNigeria()) return '🇳🇬 Pan Nigeria (all regions)'
    const parts = Object.entries(grouped).map(([country, regions]) => {
      if (country === 'Nigeria' && isPanNigeria()) return '🇳🇬 Pan Nigeria'
      return `${country} (${regions.length} region${regions.length !== 1 ? 's' : ''})`
    })
    return parts.join(' · ')
  }

  return (
    <div ref={ref} style={{ position: 'relative' }}>

      {/* Quick presets */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '8px', flexWrap: 'wrap' }}>
        <button
          onClick={() => onChange(PAN_NIGERIA)}
          style={{
            padding: '4px 12px', borderRadius: '20px', fontSize: '11px', fontFamily: F.sans,
            fontWeight: 600, cursor: 'pointer',
            background: isPanNigeria() ? C.goldDim : 'transparent',
            border: `1px solid ${isPanNigeria() ? C.gold : C.border}`,
            color: isPanNigeria() ? C.gold : C.muted,
          }}
        >
          🇳🇬 Pan Nigeria
        </button>
        <button
          onClick={() => onChange([])}
          style={{
            padding: '4px 12px', borderRadius: '20px', fontSize: '11px', fontFamily: F.sans,
            cursor: 'pointer', background: 'transparent',
            border: `1px solid ${C.border}`, color: C.dim,
          }}
        >
          Clear
        </button>
      </div>

      {/* Trigger */}
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: '100%', padding: '10px 14px',
          background: C.surface, border: `1px solid ${open ? C.gold : C.border}`,
          borderRadius: '10px', color: value.length > 0 ? C.text : C.muted,
          fontSize: '13px', fontFamily: F.sans, cursor: 'pointer',
          textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          transition: 'border-color 0.2s',
        }}
      >
        <span>{getDisplayLabel()}</span>
        <span style={{ color: C.muted, fontSize: '11px' }}>{open ? '▲' : '▼'}</span>
      </button>

      {/* Dropdown */}
      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0,
          background: C.card, border: `1px solid ${C.border}`, borderRadius: '12px',
          zIndex: 500, boxShadow: '0 8px 32px rgba(0,0,0,0.5)', overflow: 'hidden',
          display: 'grid', gridTemplateColumns: '1fr 1fr 1fr',
        }}>

          {/* Column 1: Continents */}
          <div style={{ borderRight: `1px solid ${C.border}`, maxHeight: '320px', overflowY: 'auto' }}>
            <p style={{ padding: '10px 12px 6px', fontSize: '10px', color: C.muted, fontFamily: F.sans, fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase', position: 'sticky', top: 0, background: C.card, margin: 0 }}>Continent</p>
            {continents.map(c => (
              <button key={c} onClick={() => { setSelectedContinent(c); setSelectedCountry(null); setRegionSearch('') }}
                style={{ width: '100%', padding: '9px 12px', background: selectedContinent === c ? C.goldDim : 'transparent', border: 'none', color: selectedContinent === c ? C.gold : C.text, fontSize: '12px', fontFamily: F.sans, cursor: 'pointer', textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>{c}</span>
                {selectedContinent === c && <span style={{ fontSize: '10px' }}>▶</span>}
              </button>
            ))}
          </div>

          {/* Column 2: Countries */}
          <div style={{ borderRight: `1px solid ${C.border}`, maxHeight: '320px', overflowY: 'auto' }}>
            <p style={{ padding: '10px 12px 6px', fontSize: '10px', color: C.muted, fontFamily: F.sans, fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase', position: 'sticky', top: 0, background: C.card, margin: 0 }}>Country</p>
            {selectedContinent ? countries.map(country => {
              const selectedCount = value.filter(v => v.country === country).length
              return (
                <button key={country} onClick={() => { setSelectedCountry(country); setRegionSearch('') }}
                  style={{ width: '100%', padding: '9px 12px', background: selectedCountry === country ? C.goldDim : 'transparent', border: 'none', color: selectedCountry === country ? C.gold : C.text, fontSize: '12px', fontFamily: F.sans, cursor: 'pointer', textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>{country}</span>
                  {selectedCount > 0 && <span style={{ fontSize: '10px', background: C.gold + '22', color: C.gold, borderRadius: '10px', padding: '1px 6px' }}>{selectedCount}</span>}
                </button>
              )
            }) : <p style={{ padding: '12px', fontSize: '12px', color: C.dim, fontFamily: F.sans }}>← Select continent</p>}
          </div>

          {/* Column 3: Regions */}
          <div style={{ maxHeight: '320px', overflowY: 'auto' }}>
            {selectedCountry ? (
              <>
                <div style={{ padding: '8px 10px', position: 'sticky', top: 0, background: C.card, borderBottom: `1px solid ${C.border}` }}>
                  <input style={inp} placeholder="Search regions…" value={regionSearch} onChange={e => setRegionSearch(e.target.value)} />
                  <button onClick={() => toggleCountryAll(selectedCountry)} style={{ width: '100%', marginTop: '4px', padding: '5px 8px', background: 'transparent', border: `1px solid ${C.border}`, borderRadius: '6px', color: C.muted, fontSize: '11px', cursor: 'pointer', fontFamily: F.sans }}>
                    {getRegions(selectedCountry).every(r => value.find(v => v.country === selectedCountry && v.region === r)) ? '✕ Deselect All' : '✓ Select All'}
                  </button>
                </div>
                {regions.map(region => {
                  const selected = !!value.find(v => v.country === selectedCountry && v.region === region)
                  return (
                    <button key={region} onClick={() => toggleRegion(selectedCountry, region)}
                      style={{ width: '100%', padding: '8px 12px', background: selected ? C.goldDim : 'transparent', border: 'none', color: selected ? C.gold : C.text, fontSize: '12px', fontFamily: F.sans, cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: '14px', height: '14px', borderRadius: '3px', border: `2px solid ${selected ? C.gold : C.dim}`, background: selected ? C.gold : 'transparent', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '8px', color: C.bg }}>{selected ? '✓' : ''}</div>
                      {region}
                    </button>
                  )
                })}
              </>
            ) : <p style={{ padding: '12px', fontSize: '12px', color: C.dim, fontFamily: F.sans }}>← Select country</p>}
          </div>
        </div>
      )}
    </div>
  )
}
