import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { C } from '../tokens.js'
import AppNav from '../components/layout/AppNav.jsx'
import PlatformLanding from '../components/PlatformLanding.jsx'
import AdminSetup from '../components/AdminSetup.jsx'
import AdminPanel from '../components/admin/AdminPanel.jsx'
import { useBrands, useCampaigns } from '../hooks.js'
import { ADMIN_EMAIL } from '../App.jsx'

export default function AppPage({ user, setUser, tab }) {
  const navigate = useNavigate()
  const [activeCampaign, setActiveCampaign] = useState(null)
  const [activeBrand,    setActiveBrand]    = useState(null)

  const { data: brands,    refetch: refetchBrands } = useBrands()
  const { data: campaigns                         } = useCampaigns()

  const handleOpenCampaign = (campaign, brand) => {
    setActiveCampaign(campaign)
    setActiveBrand(brand)
    navigate(`/app/insights/${campaign.id}`)
  }

  // Admin panel tab
  if (tab === 'admin' && user?.email === ADMIN_EMAIL) {
    return (
      <div style={{ minHeight: '100vh', background: C.bg }}>
        <AppNav user={user} activeCampaign={activeCampaign} />
        <AdminPanel user={user} onExit={() => navigate('/app')} />
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: C.bg }}>
      <AppNav user={user} activeCampaign={activeCampaign} />

      {(!tab || tab === 'platform') && (
        <PlatformLanding
          setView={v => v === 'admin' ? navigate('/app/setup') : navigate('/app')}
          setActiveBrand={setActiveBrand}
          setActiveCampaign={c => { setActiveCampaign(c); navigate(`/app/insights/${c.id}`) }}
          brands={brands ?? []}
          campaigns={campaigns ?? []}
        />
      )}

      {tab === 'setup' && (
        <AdminSetup
          setView={v => navigate(v === 'dashboard' ? `/app/insights/${activeCampaign?.id}` : '/app')}
          setActiveBrand={setActiveBrand}
          setActiveCampaign={setActiveCampaign}
          brands={brands ?? []}
          refetchBrands={refetchBrands}
        />
      )}
    </div>
  )
}
