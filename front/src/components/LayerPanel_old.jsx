import { useState } from 'react'

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
  const [width, setWidth] = useState(260)
  const [isResizing, setIsResizing] = useState(false)

  const groupNames = [...new Set(layers.map((l) => l.group))]
  const initialGroups = Object.fromEntries(groupNames.map((g) => [g, true]))
  const [openGroups, setOpenGroups] = useState(initialGroups)

  function startResize(e) {
    setIsResizing(true)
    const startX = e.clientX
    const startWidth = width
    function onMouseMove(e) {
      setWidth(Math.min(500, Math.max(180, startWidth + e.clientX - startX)))
    }
    function onMouseUp() {
      setIsResizing(false)
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
    }
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
  }

  function toggleGroup(groupName) {
    setOpenGroups((prev) => ({ ...prev, [groupName]: !prev[groupName] }))
  }

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
            fontSize: '10px',
            fontWeight: '700',
            color: theme.accent,
            letterSpacing: '2px',
            textTransform: 'uppercase',
            marginBottom: '4px',
          }}>
            Projet Orion
          </div>
          <div style={{
            fontSize: '18px',
            fontWeight: '700',
            color: theme.text,
            letterSpacing: '1px',
            textTransform: 'uppercase',
          }}>
            Couches
          </div>
        </div>

        {/* LISTE DES GROUPES */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {groupNames.map((groupName) => {
            const groupLayers = layers.filter((l) => l.group === groupName)
            const isOpen = openGroups[groupName]
            const allVisible = groupLayers.every((l) => l.visible)
            const someVisible = groupLayers.some((l) => l.visible)

            return (
              <div key={groupName}>

                {/* EN-TÊTE DU GROUPE */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 16px',
                  backgroundColor: theme.bgGroup,
                  borderBottom: `1px solid ${theme.border}`,
                  userSelect: 'none',
                }}>

                  {/* Case à cocher groupe + nom */}
                  <div
                    onClick={() => onToggleGroup(groupName)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      cursor: 'pointer',
                      flex: 1,
                    }}
                  >
                    <div style={{
                      width: '14px',
                      height: '14px',
                      borderRadius: '3px',
                      border: `2px solid ${allVisible || someVisible ? theme.accent : theme.textMuted}`,
                      backgroundColor: allVisible ? theme.accent : 'transparent',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      transition: 'all 0.15s',
                    }}>
                      {allVisible && (
                        <svg width="8" height="8" viewBox="0 0 10 10" fill="none">
                          <path d="M1.5 5L3.5 7.5L8.5 2.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                      {!allVisible && someVisible && (
                        <div style={{ width: '6px', height: '2px', backgroundColor: theme.accent }} />
                      )}
                    </div>
                    <span style={{
                      fontSize: '11px',
                      fontWeight: '700',
                      color: theme.textMuted,
                      letterSpacing: '1px',
                      textTransform: 'uppercase',
                    }}>
                      {groupName}
                    </span>
                  </div>

                  {/* Flèche replier */}
                  <span
                    onClick={() => toggleGroup(groupName)}
                    style={{
                      color: theme.textMuted,
                      fontSize: '10px',
                      transition: 'transform 0.2s',
                      transform: isOpen ? 'rotate(0deg)' : 'rotate(-90deg)',
                      display: 'inline-block',
                      cursor: 'pointer',
                      padding: '4px',
                    }}
                  >
                    ▼
                  </span>
                </div>

                {/* COUCHES DU GROUPE */}
                {isOpen && groupLayers.map((layer) => (
                  <div
                    key={layer.id}
                    onClick={() => onToggle(layer.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '10px 16px',
                      borderBottom: `1px solid ${theme.border}`,
                      cursor: 'pointer',
                      backgroundColor: layer.visible ? theme.bgHover : 'transparent',
                      transition: 'background-color 0.15s',
                      userSelect: 'none',
                    }}
                  >
                    <div style={{
                      width: '16px',
                      height: '16px',
                      borderRadius: '3px',
                      border: `2px solid ${layer.visible ? theme.accent : theme.textMuted}`,
                      backgroundColor: layer.visible ? theme.accent : 'transparent',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      transition: 'all 0.15s',
                    }}>
                      {layer.visible && (
                        <svg width="9" height="9" viewBox="0 0 10 10" fill="none">
                          <path d="M1.5 5L3.5 7.5L8.5 2.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                    </div>
                    <span style={{
                      fontSize: '13px',
                      color: layer.visible ? theme.text : theme.textMuted,
                      fontWeight: layer.visible ? '500' : '400',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
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
      <div
        onClick={() => setCollapsed(!collapsed)}
        style={{
          position: 'absolute',
          top: '50%',
          left: collapsed ? '0px' : `${width + 4}px`,
          transform: 'translateY(-50%)',
          width: '18px',
          height: '48px',
          backgroundColor: theme.bg,
          borderRadius: '0 6px 6px 0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          boxShadow: '2px 0 6px rgba(0,0,0,0.3)',
          transition: 'left 0.25s ease',
          pointerEvents: 'all',
          userSelect: 'none',
          zIndex: 10,
        }}
      >
        <span style={{ fontSize: '9px', color: theme.textMuted }}>
          {collapsed ? '▶' : '◀'}
        </span>
      </div>

    </div>
  )
}

export default LayerPanel