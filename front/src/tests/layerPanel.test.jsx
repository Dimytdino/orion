// src/tests/layerPanel.test.jsx
//
// Tests du composant LayerPanel — critères CA-02 et CA-05 (côté UI).
//
// On valide ici le COMPORTEMENT du panneau :
//   - Affichage des couches avec leur titre lisible (pas le nom technique GeoServer).
//   - Déclenchement de onToggle au clic sur une couche.
//   - Déclenchement de onToggleGroup au clic sur l'en-tête de groupe.
//   - Accessibilité minimale : boutons avec aria-label, aria-pressed.
//
// Pourquoi @testing-library/react :
//   Simule un vrai arbre React + interactions utilisateur (clic, clavier)
//   sans dépendre du navigateur. Idéal pour valider que le composant répond
//   correctement aux props et aux actions.

import React from 'react'
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'

// Testing Library ne peut pas appeler afterEach automatiquement en mode non-global.
// On vide le DOM après chaque test pour éviter l'accumulation de composants rendus.
afterEach(() => {
  cleanup()
})
import LayerPanel from '../components/LayerPanel.jsx'

// Fixtures — deux couches dans deux groupes distincts
const LAYERS = [
  {
    id: 'couche_a',
    title: 'Limites communales',
    type: 'WMS',
    group: 'Référentiel',
    visible: true,
    visibleByDefault: true,
  },
  {
    id: 'couche_b',
    title: 'ZIC',
    type: 'WMS',
    group: 'Environnement',
    visible: false,
    visibleByDefault: false,
  },
]

const NO_OP = () => {}

describe('LayerPanel — rendu et interactions', () => {
  describe('Affichage', () => {
    it('affiche le titre lisible de chaque couche (pas le nom technique)', () => {
      render(<LayerPanel layers={LAYERS} onToggle={NO_OP} onToggleGroup={NO_OP} />)

      expect(screen.getByText('Limites communales')).toBeDefined()
      expect(screen.getByText('ZIC')).toBeDefined()
    })

    it('affiche les noms de groupes', () => {
      render(<LayerPanel layers={LAYERS} onToggle={NO_OP} onToggleGroup={NO_OP} />)

      expect(screen.getByText('Référentiel')).toBeDefined()
      expect(screen.getByText('Environnement')).toBeDefined()
    })

    it('affiche le compteur de couches actives', () => {
      render(<LayerPanel layers={LAYERS} onToggle={NO_OP} onToggleGroup={NO_OP} />)

      // 1 couche visible sur 2
      expect(screen.getByText('1 / 2 couches actives')).toBeDefined()
    })

    it('affiche un panneau vide sans crash si layers est vide', () => {
      render(<LayerPanel layers={[]} onToggle={NO_OP} onToggleGroup={NO_OP} />)
      expect(screen.getByText('0 / 0 couches actives')).toBeDefined()
    })
  })

  describe('Interactions — toggle individuel', () => {
    it('appelle onToggle avec l\'id de la couche au clic', () => {
      const onToggle = vi.fn()
      render(<LayerPanel layers={LAYERS} onToggle={onToggle} onToggleGroup={NO_OP} />)

      // Clic sur le bouton de la couche "Limites communales"
      const btn = screen.getByRole('button', {
        name: /Masquer la couche Limites communales/i,
      })
      fireEvent.click(btn)

      expect(onToggle).toHaveBeenCalledOnce()
      expect(onToggle).toHaveBeenCalledWith('couche_a')
    })

    it('appelle onToggle avec le bon id pour une couche masquée', () => {
      const onToggle = vi.fn()
      render(<LayerPanel layers={LAYERS} onToggle={onToggle} onToggleGroup={NO_OP} />)

      const btn = screen.getByRole('button', { name: /Afficher la couche ZIC/i })
      fireEvent.click(btn)

      expect(onToggle).toHaveBeenCalledWith('couche_b')
    })
  })

  describe('Interactions — toggle de groupe', () => {
    it('appelle onToggleGroup avec le nom du groupe au clic sur l\'en-tête', () => {
      const onToggleGroup = vi.fn()
      render(<LayerPanel layers={LAYERS} onToggle={NO_OP} onToggleGroup={onToggleGroup} />)

      const btn = screen.getByRole('button', {
        name: /Afficher ou masquer toutes les couches du groupe Référentiel/i,
      })
      fireEvent.click(btn)

      expect(onToggleGroup).toHaveBeenCalledOnce()
      expect(onToggleGroup).toHaveBeenCalledWith('Référentiel')
    })
  })

  describe('Accessibilité', () => {
    it('les boutons de couche ont aria-pressed reflétant la visibilité', () => {
      render(<LayerPanel layers={LAYERS} onToggle={NO_OP} onToggleGroup={NO_OP} />)

      const btnVisible = screen.getByRole('button', {
        name: /Masquer la couche Limites communales/i,
      })
      const btnHidden = screen.getByRole('button', { name: /Afficher la couche ZIC/i })

      expect(btnVisible.getAttribute('aria-pressed')).toBe('true')
      expect(btnHidden.getAttribute('aria-pressed')).toBe('false')
    })
  })
})
