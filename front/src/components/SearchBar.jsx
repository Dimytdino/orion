import { useState } from 'react'

function SearchBar() {
  const [value, setValue] = useState('')

  return (
    <div style={{
      position: 'absolute',
      top: '16px',
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 1000,
      width: '400px',
      pointerEvents: 'all',
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 2px 12px rgba(0,0,0,0.15)',
        padding: '0 14px',
        gap: '10px',
      }}>
        <span style={{ color: '#999', fontSize: '16px' }}>🔍</span>
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Rechercher une adresse, une couche..."
          style={{
            border: 'none',
            outline: 'none',
            fontSize: '14px',
            color: '#333',
            padding: '12px 0',
            width: '100%',
            backgroundColor: 'transparent',
          }}
        />
        {value && (
          <span
            onClick={() => setValue('')}
            style={{ color: '#ccc', cursor: 'pointer', fontSize: '18px' }}
          >
            ×
          </span>
        )}
      </div>
    </div>
  )
}

export default SearchBar