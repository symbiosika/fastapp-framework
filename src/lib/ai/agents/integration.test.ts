/**
 * Echter Integrationstest für den Agenten-Framework
 *
 * Dieser Test demonstriert, wie ein Agent einen komplexen Workflow mit mehreren Schritten
 * ausführen kann. Der Agent verwendet mehrere Tools in einer logischen Abfolge,
 * um eine komplexe Aufgabe zu erledigen.
 *
 * Dieser Test verwendet echte Dienste ohne Mocks:
 * - Echter Runner für die Ausführung des Agenten
 * - Echte Datenbankverbindung für die Speicherung der Chat-Session
 * - Echte AI-Dienste für die Verarbeitung der Anfrage
 *
 * Anwendungsfall:
 * Ein Benutzer möchte einen deutschen Text ins Französische übersetzen lassen
 * und gleichzeitig eine Audiodatei der Übersetzung erhalten.
 *
 * Benutzeranfrage:
 * "Übersetze mir: das wetter ist schön auf französisch und erstelle mir ein audio"
 *
 * Erwarteter Workflow:
 * 1. Der Agent analysiert die Anfrage und erkennt, dass zwei Schritte notwendig sind
 * 2. Der Agent verwendet das translate_text Tool, um den Text zu übersetzen
 * 3. Der Agent speichert das Ergebnis der Übersetzung
 * 4. Der Agent verwendet das text_to_speech Tool mit dem übersetzten Text
 * 5. Der Agent gibt eine zusammenfassende Antwort mit beiden Ergebnissen zurück
 *
 * Hinweis:
 * In einer echten Umgebung würde dieser Test mit einem echten Übersetzungsdienst
 * und einem echten Text-zu-Sprache-Dienst arbeiten. Für diesen Test verwenden wir
 * eine einfache Übersetzungstabelle, um die Funktionalität zu demonstrieren.
 */

import { describe, test, expect, beforeAll } from "bun:test";
import { Agent } from "./agent";
import { Runner } from "./runner";
import { functionTool, textToSpeechTool } from "./tool";
import { executeAgentWorkflow } from "./handoff";
import {
  TEST_USER_1,
  TEST_ORGANISATION_1,
  initTests,
} from "../../../test/init.test";
import type { ChatSessionContext } from "../chat/chat-store";
import { nanoid } from "nanoid";

// Dieser Test verwendet echte Dienste ohne Mocks
describe("Agent Integration Tests", () => {
  // Initialisiere die Datenbank vor allen Tests
  beforeAll(async () => {
    // Initialisiere die Datenbank
    await initTests();
  });

  // Erstelle ein Übersetzungs-Tool
  const translateTool = functionTool(
    async (args: { text: string; targetLanguage: string }, context) => {
      // In einer echten Implementierung würde hier ein Übersetzungsdienst aufgerufen werden
      // Für diesen Test verwenden wir eine einfache Übersetzungstabelle
      const translations: Record<string, Record<string, string>> = {
        "das wetter ist schön": {
          französisch: "le temps est beau",
          englisch: "the weather is nice",
          spanisch: "el tiempo es hermoso",
        },
        "hallo welt": {
          französisch: "bonjour le monde",
          englisch: "hello world",
          spanisch: "hola mundo",
        },
      };

      const sourceText = args.text.toLowerCase();
      const language = args.targetLanguage.toLowerCase();

      // Prüfe, ob wir eine Übersetzung haben
      if (translations[sourceText] && translations[sourceText][language]) {
        return {
          originalText: args.text,
          translatedText: translations[sourceText][language],
          targetLanguage: args.targetLanguage,
        };
      }

      // Fallback für unbekannte Texte/Sprachen
      return {
        originalText: args.text,
        translatedText: `[Übersetzung von "${args.text}" auf ${args.targetLanguage}]`,
        targetLanguage: args.targetLanguage,
      };
    },
    {
      name: "translate_text",
      description: "Übersetzt einen Text in die angegebene Zielsprache",
      parameters: {
        text: {
          type: "string",
          description: "Der zu übersetzende Text",
        },
        targetLanguage: {
          type: "string",
          description: "Die Zielsprache für die Übersetzung",
        },
      },
    }
  );

  // Erstelle ein Wetter-Tool als zusätzliches Beispiel für einen komplexen Workflow
  const weatherTool = functionTool(
    async (args: { location: string }, context) => {
      // In einer echten Implementierung würde hier ein Wetterdienst aufgerufen werden
      // Für diesen Test verwenden wir eine einfache Wetter-Tabelle
      const weatherData: Record<string, any> = {
        berlin: {
          temperature: 22,
          condition: "sonnig",
          humidity: 65,
        },
        paris: {
          temperature: 24,
          condition: "leicht bewölkt",
          humidity: 60,
        },
        london: {
          temperature: 18,
          condition: "regnerisch",
          humidity: 80,
        },
      };

      const location = args.location.toLowerCase();

      // Prüfe, ob wir Wetterdaten haben
      if (weatherData[location]) {
        return {
          location: args.location,
          ...weatherData[location],
        };
      }

      // Fallback für unbekannte Orte
      return {
        location: args.location,
        temperature: 20,
        condition: "unbekannt",
        humidity: 70,
      };
    },
    {
      name: "get_weather",
      description: "Ruft aktuelle Wetterdaten für einen bestimmten Ort ab",
      parameters: {
        location: {
          type: "string",
          description: "Der Ort, für den Wetterdaten abgerufen werden sollen",
        },
      },
    }
  );

  // Erstelle ein Notiz-Tool zum Speichern von Informationen
  const noteTool = functionTool(
    async (args: { note: string; category?: string }, context) => {
      // In einer echten Implementierung würde hier eine Notiz in einer Datenbank gespeichert
      // Für diesen Test geben wir einfach eine Bestätigung zurück
      return {
        success: true,
        noteId: nanoid(8),
        note: args.note,
        category: args.category || "allgemein",
        timestamp: new Date().toISOString(),
      };
    },
    {
      name: "save_note",
      description: "Speichert eine Notiz für den Benutzer",
      parameters: {
        note: {
          type: "string",
          description: "Der Text der zu speichernden Notiz",
        },
        category: {
          type: "string",
          description: "Die Kategorie der Notiz (optional)",
        },
      },
    }
  );

  // Erstelle einen Multi-Tool-Agenten
  const createMultiToolAgent = () => {
    return new Agent({
      name: "MultiToolAssistant",
      instructions: `Du bist ein hilfreicher Assistent, der komplexe Aufgaben in mehreren Schritten lösen kann.
      
      Du hast Zugriff auf folgende Tools:
      - translate_text: Übersetzt Text in eine andere Sprache
      - text_to_speech: Wandelt Text in Sprache um
      - get_weather: Ruft Wetterdaten für einen Ort ab
      - save_note: Speichert eine Notiz für den Benutzer
      
      Wenn ein Benutzer nach einer Übersetzung fragt:
      1. Verwende das translate_text Tool, um den Text zu übersetzen
      2. Speichere das Ergebnis mit dem save_note Tool
      3. Wenn der Benutzer auch nach Audio fragt, verwende das text_to_speech Tool mit dem übersetzten Text
      
      Wenn ein Benutzer nach Wetter fragt:
      1. Verwende das get_weather Tool, um Wetterdaten abzurufen
      2. Wenn der Benutzer auch nach einer Übersetzung fragt, übersetze die Wetterbeschreibung
      
      Führe immer alle notwendigen Schritte in der richtigen Reihenfolge aus, um die Anfrage vollständig zu bearbeiten.
      Gib eine zusammenfassende Antwort mit allen Ergebnissen zurück.`,
      model: "gpt-4o",
      tools: [
        translateTool,
        textToSpeechTool({
          voice: "alloy",
        }),
        weatherTool,
        noteTool,
      ],
    });
  };

  test("Komplexer Workflow: Übersetzen und Audio erstellen", async () => {
    // Erstelle den Agenten
    const agent = createMultiToolAgent();

    // Erstelle den Kontext für den Agenten
    const context: ChatSessionContext = {
      chatId: "test-" + nanoid(8),
      userId: TEST_USER_1.id,
      organisationId: TEST_ORGANISATION_1.id,
    };

    // Führe den Agenten mit einer Benutzeranfrage aus
    const userInput =
      "Übersetze mir: das wetter ist schön auf französisch und erstelle mir ein audio";

    console.log("Starte Agenten-Ausführung mit Eingabe:", userInput);

    // Führe den Agenten mit echtem Runner aus
    const result = await Runner.run(agent, userInput, context);

    console.log("Agenten-Ausführung abgeschlossen");
    console.log("Ausgabe:", result.output);

    // Überprüfe das Ergebnis
    expect(result).toBeDefined();
    expect(result.output).toBeDefined();

    // Überprüfe, ob die Variablen gespeichert wurden
    expect(result.variables).toBeDefined();

    // Überprüfe, ob der Agent die Anfrage verarbeitet hat
    expect(result.output.length).toBeGreaterThan(0);

    // Überprüfe, ob der Agent das Übersetzungs-Tool verwendet hat
    expect(
      result.messages.some(
        (msg) =>
          typeof msg.content === "string" &&
          msg.content.includes("translate_text")
      )
    ).toBe(true);

    // Überprüfe, ob der Agent das Text-to-Speech-Tool verwendet hat
    expect(
      result.messages.some(
        (msg) =>
          typeof msg.content === "string" &&
          msg.content.includes("text_to_speech")
      )
    ).toBe(true);

    // Überprüfe, ob der Agent das Notiz-Tool verwendet hat
    expect(
      result.messages.some(
        (msg) =>
          typeof msg.content === "string" &&
          msg.content.includes("save_note")
      )
    ).toBe(true);

    console.log("Test erfolgreich abgeschlossen");
  }, 30000); // Timeout auf 30 Sekunden für echte API-Aufrufe

  test("Komplexer Workflow: Wetter und Übersetzung", async () => {
    // Erstelle den Agenten
    const agent = createMultiToolAgent();

    // Erstelle den Kontext für den Agenten
    const context: ChatSessionContext = {
      chatId: "test-" + nanoid(8),
      userId: TEST_USER_1.id,
      organisationId: TEST_ORGANISATION_1.id,
    };

    // Führe den Agenten mit einer Benutzeranfrage aus
    const userInput =
      "Wie ist das Wetter in Paris und übersetze die Beschreibung ins Deutsche";

    console.log("Starte Agenten-Ausführung mit Eingabe:", userInput);

    // Führe den Agenten mit echtem Runner aus
    const result = await Runner.run(agent, userInput, context);

    console.log("Agenten-Ausführung abgeschlossen");
    console.log("Ausgabe:", result.output);

    // Überprüfe das Ergebnis
    expect(result).toBeDefined();
    expect(result.output).toBeDefined();

    // Überprüfe, ob die Variablen gespeichert wurden
    expect(result.variables).toBeDefined();

    // Überprüfe, ob der Agent die Anfrage verarbeitet hat
    expect(result.output.length).toBeGreaterThan(0);

    // Überprüfe, ob der Agent das Wetter-Tool verwendet hat
    expect(
      result.messages.some(
        (msg) =>
          typeof msg.content === "string" &&
          msg.content.includes("get_weather")
      )
    ).toBe(true);

    // Überprüfe, ob der Agent das Übersetzungs-Tool verwendet hat
    expect(
      result.messages.some(
        (msg) =>
          typeof msg.content === "string" &&
          msg.content.includes("translate_text")
      )
    ).toBe(true);

    console.log("Test erfolgreich abgeschlossen");
  }, 30000); // Timeout auf 30 Sekunden für echte API-Aufrufe

  test("Multi-Agent Workflow: Übersetzen, Speichern und Audio erstellen", async () => {
    // Erstelle spezialisierte Agenten für jeden Schritt
    
    // 1. Übersetzungs-Agent
    const translationAgent = new Agent({
      name: "TranslationAgent",
      instructions: "Du bist ein Übersetzungs-Assistent. Übersetze den Text in die angegebene Zielsprache.",
      model: "gpt-4o",
      tools: [translateTool]
    });
    
    // 2. Notiz-Agent
    const noteAgent = new Agent({
      name: "NoteAgent",
      instructions: "Du bist ein Notiz-Assistent. Speichere die übersetzte Information als Notiz.",
      model: "gpt-4o",
      tools: [noteTool]
    });
    
    // 3. Audio-Agent
    const audioAgent = new Agent({
      name: "AudioAgent",
      instructions: "Du bist ein Audio-Assistent. Erstelle eine Audiodatei aus dem übersetzten Text.",
      model: "gpt-4o",
      tools: [textToSpeechTool({
        voice: "alloy",
      })]
    });
    
    // Erstelle den Kontext für den Workflow
    const context: ChatSessionContext = {
      chatId: "test-workflow-" + nanoid(8),
      userId: TEST_USER_1.id,
      organisationId: TEST_ORGANISATION_1.id,
    };
    
    // Führe den Workflow mit einer Benutzeranfrage aus
    const userInput = "Übersetze 'das wetter ist schön' auf französisch, speichere es und erstelle ein audio";
    
    console.log("Starte Multi-Agent-Workflow mit Eingabe:", userInput);
    
    // Führe den Workflow aus
    const result = await executeAgentWorkflow(
      [translationAgent, noteAgent, audioAgent],
      userInput,
      context,
      {
        workflowName: "translate-save-audio",
        passThroughOutput: false, // Übergebe strukturierte Nachrichten zwischen Agenten
        onAgentStart: (agent, input) => {
          console.log(`Agent ${agent.name} startet...`);
        },
        onAgentEnd: (agent, result) => {
          console.log(`Agent ${agent.name} abgeschlossen.`);
        }
      }
    );
    
    console.log("Multi-Agent-Workflow abgeschlossen");
    console.log("Finale Ausgabe:", result.output);
    
    // Überprüfe das Ergebnis
    expect(result).toBeDefined();
    expect(result.output).toBeDefined();
    
    // Überprüfe, ob die Variablen gespeichert wurden
    expect(result.variables).toBeDefined();
    
    // Überprüfe, ob der Workflow erfolgreich war
    expect(result.output.length).toBeGreaterThan(0);
    
    console.log("Multi-Agent-Workflow-Test erfolgreich abgeschlossen");
  }, 60000); // Timeout auf 60 Sekunden für komplexen Workflow
});
