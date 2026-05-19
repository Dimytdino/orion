// ─────────────────────────────────────────────────────────────────────────────
// LayerPanel.jsx — version corrigée
// Corrections : bug openGroups, memory leak resize, PropTypes, accessibilité
// ─────────────────────────────────────────────────────────────────────────────

// FIX ★ NOUVEAU — on importe useEffect et useRef en plus de useState
// useEffect = "exécute du code quand quelque chose change"
// useRef    = "boîte mémo qui survit aux re-rendus sans provoquer un re-rendu"
import { useState, useEffect, useRef } from 'react'

// FIX ★ PRIORITÉ 2 — PropTypes : le contrat de données du composant
// Agit comme un filet de sécurité : si Rim passe un string là où on attend
// un booléen, React affichera un avertissement dans la console.
import PropTypes from 'prop-types'

const theme = {
  bg: '#0d2137',
  bgHover: '#1a3a5c',
  bgGroup: '#0a1c2e',
  accent: '#4a9fd4',
  text: '#ffffff',
  textMuted: '#8aafc8',
  border: '#1e3a52',
}

function LayerPanel({ layers, onToggle, onToggleGroup }) {
  const [collapsed, setCollapsed] = useState(false)
  const [width, setWidth]         = useState(260)
  const [isResizing, setIsResizing] = useState(false)

  // FIX ★ PRIORITÉ 1a — Initialisation correcte de openGroups
  // AVANT : useState(initialGroups) calculait initialGroups DANS le corps du
  //         composant, à chaque re-rendu. useState ignorait les recalculs
  //         suivants → les nouveaux groupes chargés depuis PostGIS n'étaient
  //         jamais inscrits → tiroirs impossibles à ouvrir/fermer.
  //
  // APRÈS : on passe une fonction à useState (lazy initializer).
  //         Elle ne tourne qu'UNE SEULE FOIS à la création du composant.
  //         C'est le point de départ ; le useEffect ci-dessous gère la suite.
  const [openGroups, setOpenGroups] = useState(() => {
    const noms = [...new Set(layers.map((l) => l.group))]
    return Object.fromEntries(noms.map((g) => [g, true]))
  })

  // FIX ★ PRIORITÉ 1a (suite) — Synchronisation quand layers change
  // Scénario : GeoNode charge de nouvelles couches depuis PostGIS après le
  // premier rendu. Sans ce useEffect, les nouveaux groupes n'ont pas d'entrée
  // dans openGroups → leur état "ouvert/fermé" est undefined → bug silencieux.
  //
  // Ce bloc dit : "après chaque changement de `layers`, vérifie si de nouveaux
  // groupes sont apparus. Si oui, ajoute-les à openGroups (ouverts par défaut)
  // sans écraser les états existants."
  useEffect(() => {
    const noms = [...new Set(layers.map((l) => l.group))]
    setOpenGroups((prev) => {
      const next = { ...prev }
      let modifie = false
      noms.forEach((g) => {
        if (!(g in next)) {       // nouveau groupe inconnu jusqu'ici ?
          next[g] = true          // → ouvert par défaut
          modifie = true
        }
      })
      return modifie ? next : prev  // si rien n'a changé, même référence
    })
  }, [layers])                      // ← se déclenche seulement si layers change

  // FIX ★ PRIORITÉ 1b — Memory leak du resize handler
  //
  // PROBLÈME AVANT :
  //   onMouseDown → addEventListener('mousemove', fn) + addEventListener('mouseup', fn)
  //   onMouseUp   → removeEventListener(...)
  //   Si le composant se démonte PENDANT que la souris est enfoncée
  //   (navigation, rechargement), les listeners restent accrochés à window
  //   pour toujours → fuite mémoire + comportements fantômes.
  //
  // SOLUTION : on stocke les fonctions dans des refs (boîtes mémo).
  //   Un useEffect avec return () => {...} (appelé "cleanup") garantit que
  //   les listeners sont retirés quand le composant disparaît, quoi qu'il arrive.
  const mouseMoveRef = useRef(null)
  const mouseUpRef   = useRef(null)

  function startResize(e) {
    setIsResizing(true)
    const startX     = e.clientX
    const startWidth = width

    // On stocke les fonctions dans les refs pour pouvoir les retirer plus tard
    mouseMoveRef.current = (ev) => {
      setWidth(Math.min(500, Math.max(180, startWidth + ev.clientX - startX)))
    }
    mouseUpRef.current = () => {
      setIsResizing(false)
      window.removeEventListener('mousemove', mouseMoveRef.current)
      window.removeEventListener('mouseup',   mouseUpRef.current)
    }

    window.addEventListener('mousemove', mouseMoveRef.current)
    window.addEventListener('mouseup',   mouseUpRef.current)
  }

  // Cleanup de sécurité au démontage du composant
  // "return () => {...}" = "avant de disparaître, fais le ménage"
  useEffect(() => {
    return () => {
      if (mouseMoveRef.current)
        window.removeEventListener('mousemove', mouseMoveRef.current)
      if (mouseUpRef.current)
        window.removeEventListener('mouseup', mouseUpRef.current)
    }
  }, [])

  function toggleGroup(groupName) {
    setOpenGroups((prev) => ({ ...prev, [groupName]: !prev[groupName] }))
  }

  // FIX ★ PRIORITÉ 3 — Accessibilité : helper clavier
  // Les divs et spans ne reçoivent pas les événements clavier par défaut.
  // Cette fonction convertit Entrée/Espace en clic → navigation clavier possible.
  function handleKey(fn) {
    return (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        fn()
      }
    }
  }

  const groupNames = [...new Set(layers.map((l) => l.group))]

  return (
    <div style={{
      position: 'absolute',
      top: 0, left: 0,
      height: '100%',
      display: 'flex',
      zIndex: 1000,
      pointerEvents: 'none',
    }}>

      {/* LE BANDEAU */}
      <div style={{
        width: collapsed ? 0 : width,
        minWidth: collapsed ? 0 : width,
        height: '100%',
        backgroundColor: theme.bg,
        overflow: 'hidden',
        transition: 'width 0.25s ease, min-width 0.25s ease',
        pointerEvents: 'all',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: 'system-ui, sans-serif',
      }}>

        {/* EN-TÊTE */}
        <div style={{
          padding: '18px 16px 14px',
          borderBottom: `1px solid ${theme.border}`,
          backgroundColor: theme.bgGroup,
        }}>
          <div style={{
            fontSize: '10px', fontWeight: '700', color: theme.accent,
            letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '4px',
          }}>
            Projet Orion
          </div>
          <div style={{
            fontSize: '18px', fontWeight: '700', color: theme.text,
            letterSpacing: '1px', textTransform: 'uppercase',
          }}>
            Couches
          </div>
        </div>

        {/* LISTE DES GROUPES */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {groupNames.map((groupName) => {
            const groupLayers = layers.filter((l) => l.group === groupName)
            const isOpen      = openGroups[groupName]
            const allVisible  = groupLayers.every((l) => l.visible)
            const someVisible = groupLayers.some((l) => l.visible)

            return (
              <div key={groupName}>

                {/* EN-TÊTE DU GROUPE */}
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '10px 16px',
                  backgroundColor: theme.bgGroup,
                  borderBottom: `1px solid ${theme.border}`,
                  userSelect: 'none',
                }}>

                  {/* FIX ★ PRIORITÉ 3 — Case à cocher groupe : rôle + clavier */}
                  {/* role="checkbox"   → dit aux lecteurs d'écran que c'est une case à cocher */}
                  {/* aria-checked      → état coché / semi-coché / décoché */}
                  {/* tabIndex={0}      → navigable au clavier (Tab) */}
                  {/* onKeyDown         → Entrée/Espace déclenchent le clic */}
                  <div
                    role="checkbox"
                    aria-checked={allVisible ? true : someVisible ? 'mixed' : false}
                    aria-label={`Groupe ${groupName} — basculer visibilité`}
                    tabIndex={0}
                    onClick={() => onToggleGroup(groupName)}
                    onKeyDown={handleKey(() => onToggleGroup(groupName))}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '8px',
                      cursor: 'pointer', flex: 1,
                    }}
                  >
                    <div style={{
                      width: '14px', height: '14px', borderRadius: '3px',
                      border: `2px solid ${allVisible || someVisible ? theme.accent : theme.textMuted}`,
                      backgroundColor: allVisible ? theme.accent : 'transparent',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0, transition: 'all 0.15s',
                    }}>
                      {allVisible && (
                        <svg width="8" height="8" viewBox="0 0 10 10" fill="none" aria-hidden="true">
                          <path d="M1.5 5L3.5 7.5L8.5 2.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                      {!allVisible && someVisible && (
                        <div style={{ width: '6px', height: '2px', backgroundColor: theme.accent }} />
                      )}
                    </div>
                    <span style={{
                      fontSize: '11px', fontWeight: '700', color: theme.textMuted,
                      letterSpacing: '1px', textTransform: 'uppercase',
                    }}>
                      {groupName}
                    </span>
                  </div>

                  {/* FIX ★ PRIORITÉ 3 — Bouton flèche : role + aria-expanded + clavier */}
                  {/* role="button"     → dit aux lecteurs d'écran que c'est un bouton */}
                  {/* aria-expanded     → dit si le groupe est déplié ou non */}
                  {/* aria-label        → texte descriptif pour les lecteurs d'écran */}
                  <span
                    role="button"
                    aria-expanded={isOpen}
                    aria-label={isOpen ? `Replier ${groupName}` : `Déplier ${groupName}`}
                    tabIndex={0}
                    onClick={() => toggleGroup(groupName)}
                    onKeyDown={handleKey(() => toggleGroup(groupName))}
                    style={{
                      color: theme.textMuted, fontSize: '10px',
                      transition: 'transform 0.2s',
                      transform: isOpen ? 'rotate(0deg)' : 'rotate(-90deg)',
                      display: 'inline-block',
                      cursor: 'pointer', padding: '4px',
                    }}
                  >
                    ▼
                  </span>
                </div>

                {/* COUCHES DU GROUPE */}
                {isOpen && groupLayers.map((layer) => (
                  // FIX ★ PRIORITÉ 3 — Ligne de couche : role + aria-checked + clavier
                  <div
                    key={layer.id}
                    role="checkbox"
                    aria-checked={layer.visible}
                    aria-label={`Couche ${layer.label} — ${layer.visible ? 'visible' : 'masquée'}`}
                    tabIndex={0}
                    onClick={() => onToggle(layer.id)}
                    onKeyDown={handleKey(() => onToggle(layer.id))}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '10px',
                      padding: '10px 16px',
                      borderBottom: `1px solid ${theme.border}`,
                      cursor: 'pointer',
                      backgroundColor: layer.visible ? theme.bgHover : 'transparent',
                      transition: 'background-color 0.15s',
                      userSelect: 'none',
                    }}
                  >
                    <div style={{
                      width: '16px', height: '16px', borderRadius: '3px',
                      border: `2px solid ${layer.visible ? theme.accent : theme.textMuted}`,
                      backgroundColor: layer.visible ? theme.accent : 'transparent',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0, transition: 'all 0.15s',
                    }}>
                      {layer.visible && (
                        <svg width="9" height="9" viewBox="0 0 10 10" fill="none" aria-hidden="true">
                          <path d="M1.5 5L3.5 7.5L8.5 2.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                    </div>
                    <span style={{
                      fontSize: '13px',
                      color: layer.visible ? theme.text : theme.textMuted,
                      fontWeight: layer.visible ? '500' : '400',
                      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                      transition: 'color 0.15s',
                    }}>
                      {layer.label}
                    </span>
                  </div>
                ))}
              </div>
            )
          })}
        </div>

        {/* PIED DE PAGE */}
        <div style={{
          padding: '10px 16px',
          borderTop: `1px solid ${theme.border}`,
          backgroundColor: theme.bgGroup,
          fontSize: '11px',
          color: theme.textMuted,
          textAlign: 'center',
        }}>
          {layers.filter(l => l.visible).length} / {layers.length} couches actives
        </div>
      </div>

      {/* POIGNÉE DE REDIMENSIONNEMENT */}
      {!collapsed && (
        <div
          onMouseDown={startResize}
          role="separator"
          aria-label="Redimensionner le panneau"
          aria-orientation="vertical"
          tabIndex={0}
          style={{
            width: '4px',
            cursor: 'col-resize',
            backgroundColor: isResizing ? theme.accent : 'transparent',
            transition: 'background-color 0.15s',
            pointerEvents: 'all',
          }}
          onMouseEnter={e => e.currentTarget.style.backgroundColor = theme.border}
          onMouseLeave={e => { if (!isResizing) e.currentTarget.style.backgroundColor = 'transparent' }}
        />
      )}

      {/* BOUTON REPLIER / DÉPLIER */}
      {/* FIX ★ PRIORITÉ 3 — Bouton collapse : role + aria-label + clavier */}
      <div
        role="button"
        aria-label={collapsed ? 'Déplier le panneau de couches' : 'Replier le panneau de couches'}
        tabIndex={0}
        onClick={() => setCollapsed(!collapsed)}
        onKeyDown={handleKey(() => setCollapsed(!collapsed))}
        style={{
          position: 'absolute',
          top: '50%',
          left: collapsed ? '0px' : `${width + 4}px`,
          transform: 'translateY(-50%)',
          width: '18px', height: '48px',
          backgroundColor: theme.bg,
          borderRadius: '0 6px 6px 0',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer',
          boxShadow: '2px 0 6px rgba(0,0,0,0.3)',
          transition: 'left 0.25s ease',
          pointerEvents: 'all',
          userSelect: 'none',
          zIndex: 10,
        }}
      >
        <span style={{ fontSize: '9px', color: theme.textMuted }} aria-hidden="true">
          {collapsed ? '▶' : '◀'}
        </span>
      </div>

    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// FIX ★ PRIORITÉ 2 — PropTypes : contrat de données du composant
//
// C'est la documentation vivante du composant.
// Si quelqu'un appelle <LayerPanel layers="oops" /> au lieu d'un tableau,
// React affichera une alerte dans la console de développement.
//
// layerShape décrit la structure attendue de chaque objet "couche".
// ─────────────────────────────────────────────────────────────────────────────
// import PropTypes from 'prop-types' // déjà importé en haut, rappel ici pour lisibilité

const layerShape = PropTypes.shape({
  id:      PropTypes.string.isRequired,   // identifiant unique de la couche
  label:   PropTypes.string.isRequired,   // nom affiché
  group:   PropTypes.string.isRequired,   // nom du groupe parent
  visible: PropTypes.bool.isRequired,     // est-elle cochée ?
})

LayerPanel.propTypes = {
  layers:        PropTypes.arrayOf(layerShape).isRequired, // tableau de couches
  onToggle:      PropTypes.func.isRequired,  // (id) => void — coche/décoche une couche
  onToggleGroup: PropTypes.func.isRequired,  // (groupName) => void — coche/décoche un groupe
}

export default LayerPanel