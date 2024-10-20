import log from "../../../../lib/log";

const LLAMA_CLOUD_API_KEY = process.env.LLAMA_CLOUD_API_KEY;
const API_BASE_URL = "https://api.llamaindex.ai";

/**
 * Parse a PDF file as markdown
 */
export const parsePdfFileAsMardown = async (
  fileContent: File
): Promise<string> => {
  if (!LLAMA_CLOUD_API_KEY) {
    throw new Error("No API key set for LlamaParse API.");
  }

  // Upload file and start parsing
  const formData = new FormData();
  formData.append("file", fileContent, "document.pdf");

  log.debug("Uploading file to LlamaIndex API...");
  const uploadResponse = await fetch(`${API_BASE_URL}/upload`, {
    method: "POST",
    body: formData,
    headers: {
      Authorization: `Bearer ${LLAMA_CLOUD_API_KEY}`,
    },
  });

  if (!uploadResponse.ok) {
    log.error(`Upload failed: ${uploadResponse.statusText}`);
    throw new Error(`Upload failed: ${uploadResponse.statusText}`);
  }

  const { job_id: jobId } = await uploadResponse.json();
  log.debug(`Job ID: ${jobId}`);

  // Poll for job completion
  let isComplete = false;
  while (!isComplete) {
    const statusResponse = await fetch(`${API_BASE_URL}/job/${jobId}`, {
      headers: { Authorization: `Bearer ${LLAMA_CLOUD_API_KEY}` },
    });

    if (!statusResponse.ok) {
      log.error(`Status check failed: ${statusResponse.statusText}`);
      throw new Error(`Status check failed: ${statusResponse.statusText}`);
    }

    const statusData = await statusResponse.json();
    log.debug(`Status: ${statusData.status}`);
    isComplete = statusData.status === "COMPLETED";
    if (!isComplete) await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  // Get results in Markdown
  const resultResponse = await fetch(
    `${API_BASE_URL}/job/${jobId}/result/markdown`,
    {
      headers: { Authorization: `Bearer ${LLAMA_CLOUD_API_KEY}` },
    }
  );

  if (!resultResponse.ok) {
    log.error(`Result retrieval failed: ${resultResponse.statusText}`);
    throw new Error(`Result retrieval failed: ${resultResponse.statusText}`);
  }

  log.debug("Result retrieved successfully.");
  return await resultResponse.text();
};
