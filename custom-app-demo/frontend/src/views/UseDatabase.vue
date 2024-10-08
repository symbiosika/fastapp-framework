<template>
  <div class="flex flex-col items-center justify-center min-h-screen">
    <WebsiteLayoutWrapper
      title="API-Dokumentation"
      description="Zum Framework gehört eine standardmäßige Datenbank Anbindung mit Collections-Endpunkt. Zusätzlich kann einfach eigene Datenbank Logik eingebunden werden."
    >
      <h2 class="text-2xl font-bold mb-4">Beispiel-Anfrage</h2>
      <pre
        class="mt-5 p-4 bg-gray-100 rounded-lg overflow-auto max-w-full text-left mb-5"
      >
GET /api/v1/collections/users?filter=(userId={userId})</pre
      >
      <MarkdownRenderer :content="markdownContent" />
    </WebsiteLayoutWrapper>
  </div>
</template>

<script setup lang="ts">
import WebsiteLayoutWrapper from "@/views/WebsiteLayoutWrapper.vue";
import MarkdownRenderer from "@/markdown-renderer/component/MarkdownRenderer.vue";

const markdownContent = `
  # Collections-Endpunkt
  
  ## Dokumentation des Filterparameters
  
  Der Filterparameter ermöglicht komplexe Abfragen von Daten mithilfe einer benutzerdefinierten Syntax. Er unterstützt logische Operationen, Vergleiche und Gruppierungen.
  
  ### Grundlegende Syntax
  
  \`feld operator wert\`
  
  - \`feld\`: Der Name des Feldes, nach dem gefiltert werden soll
  - \`operator\`: Der Vergleichsoperator
  - \`wert\`: Der Wert, mit dem verglichen werden soll
  
  ### Operatoren
  
  - \`=\`: Gleich
  - \`!=\`: Ungleich
  - \`>\`: Größer als
  - \`>=\`: Größer oder gleich
  - \`<\`: Kleiner als
  - \`<=\`: Kleiner oder gleich
  - \`~\`: Ähnlich (Zeichenkettenmusterabgleich)
  - \`!~\`: Nicht ähnlich
  - \`?=\`: Ist null
  - \`?!=\`: Ist nicht null
  
  ### Logische Operatoren
  
  - \`&&\`: UND
  - \`||\`: ODER
  
  ### Gruppierung
  
  Verwenden Sie Klammern \`()\`, um Ausdrücke zu gruppieren und die Rangfolge zu steuern.
  
  ### Beispiele
  
  1. Einfacher Vergleich:
  
     \`\`\`
     name='John'
     \`\`\`
  
  2. Mehrere Bedingungen:
  
     \`\`\`
     alter>18 && (stadt='Berlin' || stadt='München')
     \`\`\`
  
  3. Datumsvergleich:
  
     \`\`\`
     erstelltAm>'2023-01-01'
     \`\`\`
  
  4. Null-Prüfung:
  
     \`\`\`
     email?=
     \`\`\`
  
  5. Musterabgleich:
  
     \`\`\`
     titel~'%wichtig%'
     \`\`\`
  
  6. Komplexe Abfrage:
     \`\`\`
     (status='aktiv' || status='ausstehend') && erstelltAm>'2023-01-01' && (kategorie='A' || kategorie='B')
     \`\`\`
  
  Hinweis: Zeichenkettenwerte sollten in einfache Anführungszeichen eingeschlossen werden. Datumswerte sollten im ISO 8601-Format (JJJJ-MM-TT) angegeben werden.
  `;
</script>
