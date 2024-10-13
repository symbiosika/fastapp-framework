import { eq } from "drizzle-orm";
import { getDb } from "src/lib/db/db-connection";
import { promptTemplates } from "src/lib/db/db-schema";

export const getTemplatePromptById = async (promptId: string) => {
  const result = await getDb().query.promptTemplates.findFirst({
    where: eq(promptTemplates.id, promptId),
    with: {
      promptTemplatePlaceholders: {
        with: {
          promptTemplatePlaceholderDefaults: true,
        },
      },
    },
  });

  return result;
};

// // Function to handle rate limit retries
// async function generateCompletionWithRetry(
//   prompt: string,
//   model: string
// ): Promise<string> {
//   const maxRetries = 5;
//   let retryCount = 0;

//   while (retryCount < maxRetries) {
//     try {
//       const response = await openai.createCompletion({
//         model: model,
//         prompt: prompt,
//         max_tokens: 2000,
//       });
//       return response.data.choices[0].text || "";
//     } catch (error: any) {
//       if (error.response && error.response.status === 429) {
//         // Rate limit error, wait and retry
//         retryCount++;
//         await new Promise((resolve) => setTimeout(resolve, 2000 * retryCount));
//       } else {
//         throw error;
//       }
//     }
//   }
//   throw new Error("Failed to generate completion after retries.");
// }

// // Endpoint to process the PDF files and generate audio
// app.post("/generate-audio", upload.array("files"), async (req, res) => {
//   try {
//     const files = req.files as Express.Multer.File[];
//     const {
//       template = "podcast",
//       model = "text-davinci-003",
//       voice = "default",
//     } = req.body;

//     if (!files || files.length === 0) {
//       return res.status(400).json({ error: "No PDF files uploaded." });
//     }

//     // Extract text from PDFs
//     let combinedText = "";
//     for (const file of files) {
//       const text = await extractTextFromPDF(file.path);
//       combinedText += text + "\n\n";
//       fs.unlinkSync(file.path); // Delete the file after processing
//     }

//     // Prepare the prompt
//     const instructions = INSTRUCTION_TEMPLATES[template];
//     const prompt = `
// ${instructions.intro}

// Here is the original input text:

// <input_text>
// ${combinedText}
// </input_text>

// ${instructions.textInstructions}

// <scratchpad>
// ${instructions.scratchPad}
// </scratchpad>

// ${instructions.prelude}

// <podcast_dialogue>
// ${instructions.dialog}
// </podcast_dialogue>
// `;

//     // Generate the dialogue
//     const dialogue = await generateCompletionWithRetry(prompt, model);

//     // Generate audio from the dialogue
//     const audioBuffer = await generateAudio(dialogue, voice);

//     // Send the audio and transcript as response
//     res.json({
//       audio: audioBuffer.toString("base64"), // Send audio as base64 string
//       transcript: dialogue,
//     });
//   } catch (error: any) {
//     console.error("Error:", error.message);
//     res.status(500).json({ error: error.message });
//   }
// });
