import { useState } from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'
import { useOnlineStatus } from '../hooks/useOnlineStatus'
import { useInstallPrompt } from '../hooks/useInstallPrompt'

const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent)

export function PwaStatus() {
  const online = useOnlineStatus()
  const { canInstall, installed, promptInstall } = useInstallPrompt()
  const [iosHintDismissed, setIosHintDismissed] = useState(false)

  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW()

  const showIosHint = isIos && !installed && !iosHintDismissed

  return (
    <>
      {!online && <div className="status-banner status-offline">Çevrimdışı</div>}

      {needRefresh && (
        <div className="status-banner status-update">
          <span>Yeni sürüm hazır.</span>
          <button className="link-button" onClick={() => updateServiceWorker(true)}>
            Yenile
          </button>
          <button className="link-button" onClick={() => setNeedRefresh(false)}>
            ✕
          </button>
        </div>
      )}

      {canInstall && (
        <div className="status-banner status-install">
          <span>GymTrack'i ana ekrana ekleyebilirsin.</span>
          <button className="link-button" onClick={promptInstall}>
            Yükle
          </button>
        </div>
      )}

      {showIosHint && (
        <div className="status-banner status-install">
          <span>Ana ekrana eklemek için Paylaş → Ana Ekrana Ekle</span>
          <button className="link-button" onClick={() => setIosHintDismissed(true)}>
            ✕
          </button>
        </div>
      )}
    </>
  )
}
