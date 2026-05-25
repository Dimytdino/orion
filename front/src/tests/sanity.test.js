// src/tests/sanity.test.js
//
// Test santé — vérifie que Vitest est correctement installé et opérationnel.
//
// Pourquoi ce test existe :
// Avant d'écrire des tests métier (projections, composants, hooks OpenLayers…),
// on s'assure que le runner lui-même est fonctionnel. Si ce test échoue,
// c'est la configuration Vitest/jsdom qui est cassée, pas le code applicatif.
//
// Ce test ne doit PAS être supprimé même quand d'autres tests arrivent :
// il joue le rôle de canari dans la mine — toujours là, toujours trivial.

import { describe, it, expect } from 'vitest'

describe('Sanité Vitest', () => {
  it('1 + 1 vaut 2 (test de base)', () => {
    // Opération arithmétique triviale : si elle échoue, c'est le runner lui-même
    // qui dysfontionne, pas une logique applicative.
    expect(1 + 1).toBe(2)
  })

  it("l'environnement jsdom expose window et document", () => {
    // Vérifie que jsdom est bien actif : ces objets n'existent pas en Node.js pur.
    // Indispensable pour de futurs tests de composants React qui manipulent le DOM.
    expect(typeof window).toBe('object')
    expect(typeof document).toBe('object')
  })
})
