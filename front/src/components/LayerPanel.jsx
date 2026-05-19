import { useEffect, useMemo, useRef, useState } from 'react'
import PropTypes from 'prop-types'

const MIN_WIDTH = 180
const MAX_WIDTH = 500
const DEFAULT_WIDTH = 260

const theme = {
  bg: '#0d2137',
  bgHover: '#1a3a5c',
  bgGroup: '#0a1c2e',
  accent: '#4a9fd4',
  text: '#ffffff',
  textMuted: '#8aafc8',
  border: '#1e3a52',
}

const clamp = (value, min, max) => Math.min(max, Math.max(min, value))

function CheckIcon() {
  return (
    <svg width="9" height="9" viewBox="0 0 10 10" fill="none" aria-hidden="true">
      <path
        d="M1.5 5L3.5 7.5L8.5 2.5"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function CheckboxVisual({ checked, indeterminate = false, size = 16 }) {
  return (
    <span
      aria-hidden="true"
      style={{
        width: size,
        height: size,
        borderRadius: '3px',
        border: `2px solid ${checked || indeterminate ? theme.accent : theme.textMuted}`,
        backgroundColor: checked ? theme.accent : 'transparent',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        transition: 'all 0.15s',
      }}
    >
      {checked && <CheckIcon />}
      {!checked && indeterminate && (
        <span style={{ width: '7px', height: '2px', backgroundColor: theme.accent }} />
      )}
    </span>
  )
}

function LayerPanel({ layers = [], onToggle, onToggleGroup }) {
  const [collapsed, setCollapsed] = useState(false)
  const [width, setWidth] = useState(DEFAULT_WIDTH)
  const [isResizing, setIsResizing] = useState(false)
  const [openGroups, setOpenGroups] = useState({})

  const resizeStateRef = useRef(null)

  const groupedLayers = useMemo(() => {
    return layers.reduce((acc, layer) => {
      const groupName = layer.group || 'Sans groupe'

      if (!acc[groupName]) {
        acc[groupName] = []
      }

      acc[groupName].push(layer)
      return acc
    }, {})
  }, [layers])

  const groupNames = useMemo(() => Object.keys(groupedLayers), [groupedLayers])

  useEffect(() => {
    setOpenGroups((previousOpenGroups) => {
      const nextOpenGroups = {}

      for (const groupName of groupNames) {
        nextOpenGroups[groupName] = previousOpenGroups[groupName] ?? true
      }

      return nextOpenGroups
    })
  }, [groupNames])

  useEffect(() => {
    if (!isResizing) return undefined

    function handleMouseMove(event) {
      const resizeState = resizeStateRef.current
      if (!resizeState) return

      const nextWidth = resizeState.startWidth + event.clientX - resizeState.startX
      setWidth(clamp(nextWidth, MIN_WIDTH, MAX_WIDTH))
    }

    function handleMouseUp() {
      resizeStateRef.current = null
      setIsResizing(false)
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isResizing])

  const visibleLayerCount = useMemo(
    () => layers.filter((layer) => layer.visible).length,
    [layers],
  )

  function startResize(event) {
    event.preventDefault()

    resizeStateRef.current = {
      startX: event.clientX,
      startWidth: width,
    }

    setIsResizing(true)
  }

  function toggleGroupOpen(groupName) {
    setOpenGroups((previousOpenGroups) => ({
      ...previousOpenGroups,
      [groupName]: !previousOpenGroups[groupName],
    }))
  }

  return (
    <aside
      aria-label="Panneau des couches cartographiques"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        height: '100%',
        display: 'flex',
        zIndex: 1000,
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          width: collapsed ? 0 : width,
          minWidth: collapsed ? 0 : width,
          height: '100%',
          backgroundColor: theme.bg,
          overflow: 'hidden',
          transition: isResizing ? 'none' : 'width 0.25s ease, min-width 0.25s ease',
          pointerEvents: 'all',
          display: 'flex',
          flexDirection: 'column',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        <header
          style={{
            padding: '18px 16px 14px',
            borderBottom: `1px solid ${theme.border}`,
            backgroundColor: theme.bgGroup,
          }}
        >
          <div
            style={{
              fontSize: '10px',
              fontWeight: 700,
              color: theme.accent,
              letterSpacing: '2px',
              textTransform: 'uppercase',
              marginBottom: '4px',
            }}
          >
            Projet Orion
          </div>

          <h2
            style={{
              margin: 0,
              fontSize: '18px',
              fontWeight: 700,
              color: theme.text,
              letterSpacing: '1px',
              textTransform: 'uppercase',
            }}
          >
            Couches
          </h2>
        </header>

        <div style={{ flex: 1, overflowY: 'auto' }}>
          {groupNames.map((groupName) => {
            const groupLayers = groupedLayers[groupName]
            const isOpen = openGroups[groupName] ?? true
            const allVisible = groupLayers.length > 0 && groupLayers.every((layer) => layer.visible)
            const someVisible = groupLayers.some((layer) => layer.visible)

            return (
              <section key={groupName} aria-label={`Groupe ${groupName}`}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 16px',
                    backgroundColor: theme.bgGroup,
                    borderBottom: `1px solid ${theme.border}`,
                    userSelect: 'none',
                  }}
                >
                  <button
                    type="button"
                    onClick={() => onToggleGroup(groupName)}
                    aria-pressed={allVisible}
                    aria-label={`Afficher ou masquer toutes les couches du groupe ${groupName}`}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      cursor: 'pointer',
                      flex: 1,
                      border: 'none',
                      padding: 0,
                      background: 'transparent',
                      textAlign: 'left',
                    }}
                  >
                    <CheckboxVisual checked={allVisible} indeterminate={!allVisible && someVisible} size={14} />

                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        color: theme.textMuted,
                        letterSpacing: '1px',
                        textTransform: 'uppercase',
                      }}
                    >
                      {groupName}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => toggleGroupOpen(groupName)}
                    aria-expanded={isOpen}
                    aria-label={`${isOpen ? 'Replier' : 'Déplier'} le groupe ${groupName}`}
                    style={{
                      color: theme.textMuted,
                      fontSize: '10px',
                      transition: 'transform 0.2s',
                      transform: isOpen ? 'rotate(0deg)' : 'rotate(-90deg)',
                      display: 'inline-flex',
                      cursor: 'pointer',
                      padding: '4px',
                      border: 'none',
                      background: 'transparent',
                    }}
                  >
                    ▼
                  </button>
                </div>

                {isOpen &&
                  groupLayers.map((layer) => (
                    <button
                      key={layer.id}
                      type="button"
                      onClick={() => onToggle(layer.id)}
                      aria-pressed={layer.visible}
                      aria-label={`${layer.visible ? 'Masquer' : 'Afficher'} la couche ${layer.label}`}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '10px 16px',
                        border: 'none',
                        borderBottom: `1px solid ${theme.border}`,
                        cursor: 'pointer',
                        backgroundColor: layer.visible ? theme.bgHover : 'transparent',
                        transition: 'background-color 0.15s',
                        userSelect: 'none',
                        textAlign: 'left',
                      }}
                    >
                      <CheckboxVisual checked={layer.visible} />

                      <span
                        style={{
                          fontSize: '13px',
                          color: layer.visible ? theme.text : theme.textMuted,
                          fontWeight: layer.visible ? 500 : 400,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          transition: 'color 0.15s',
                        }}
                      >
                        {layer.label}
                      </span>
                    </button>
                  ))}
              </section>
            )
          })}
        </div>

        <footer
          style={{
            padding: '10px 16px',
            borderTop: `1px solid ${theme.border}`,
            backgroundColor: theme.bgGroup,
            fontSize: '11px',
            color: theme.textMuted,
            textAlign: 'center',
          }}
        >
          {visibleLayerCount} / {layers.length} couches actives
        </footer>
      </div>

      {!collapsed && (
        <div
          role="separator"
          aria-orientation="vertical"
          aria-label="Redimensionner le panneau des couches"
          onMouseDown={startResize}
          style={{
            width: '4px',
            cursor: 'col-resize',
            backgroundColor: isResizing ? theme.accent : 'transparent',
            transition: 'background-color 0.15s',
            pointerEvents: 'all',
          }}
        />
      )}

      <button
        type="button"
        onClick={() => setCollapsed((previousCollapsed) => !previousCollapsed)}
        aria-label={collapsed ? 'Déplier le panneau des couches' : 'Replier le panneau des couches'}
        style={{
          position: 'absolute',
          top: '50%',
          left: collapsed ? '0px' : `${width + 4}px`,
          transform: 'translateY(-50%)',
          width: '18px',
          height: '48px',
          backgroundColor: theme.bg,
          border: 'none',
          borderRadius: '0 6px 6px 0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          boxShadow: '2px 0 6px rgba(0,0,0,0.3)',
          transition: isResizing ? 'none' : 'left 0.25s ease',
          pointerEvents: 'all',
          userSelect: 'none',
          zIndex: 10,
        }}
      >
        <span style={{ fontSize: '9px', color: theme.textMuted }} aria-hidden="true">
          {collapsed ? '▶' : '◀'}
        </span>
      </button>
    </aside>
  )
}

CheckboxVisual.propTypes = {
  checked: PropTypes.bool.isRequired,
  indeterminate: PropTypes.bool,
  size: PropTypes.number,
}

LayerPanel.propTypes = {
  layers: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      group: PropTypes.string,
      label: PropTypes.string.isRequired,
      visible: PropTypes.bool.isRequired,
    }),
  ),
  onToggle: PropTypes.func.isRequired,
  onToggleGroup: PropTypes.func.isRequired,
}

export default LayerPanel