import log from "../../../log";

// https://docs.cloud.llamaindex.ai/llamaparse/getting_started/api
const LLAMA_CLOUD_API_KEY = process.env.LLAMA_CLOUD_API_KEY;
const API_BASE_URL = "https://api.cloud.llamaindex.ai";

/**
 * Parse a PDF file as markdown
 */
export const parsePdfFileAsMardownLlama = async (
  fileContent: File
): Promise<{
  text: string;
}> => {
  if (!LLAMA_CLOUD_API_KEY) {
    throw new Error("No API key set for LlamaParse API.");
  }

  // Upload file and start parsing
  const formData = new FormData();
  formData.append("file", fileContent, "document.pdf");

  log.debug("Uploading file to LlamaIndex API...");
  const uploadResponse = await fetch(`${API_BASE_URL}/api/parsing/upload`, {
    method: "POST",
    body: formData,
    headers: {
      Authorization: `Bearer ${LLAMA_CLOUD_API_KEY}`,
    },
  }).catch((error) => {
    log.error(`Upload failed: ${error}`);
    throw new Error(`Upload failed: ${error}`);
  });

  if (!uploadResponse.ok) {
    log.error(`Upload failed: ${uploadResponse.statusText}`);
    throw new Error(`Upload failed: ${uploadResponse.statusText}`);
  }

  const uploadedJobData = await uploadResponse.json();
  const jobId = uploadedJobData.id;
  log.debug(`Job ID: ${JSON.stringify(uploadedJobData)}`);

  // Poll for job completion
  let isComplete = false;
  while (!isComplete) {
    const statusResponse = await fetch(
      `${API_BASE_URL}/api/parsing/job/${jobId}`,
      {
        headers: { Authorization: `Bearer ${LLAMA_CLOUD_API_KEY}` },
      }
    );

    if (!statusResponse.ok) {
      log.error(`Status check failed: ${statusResponse.statusText}`);
      throw new Error(`Status check failed: ${statusResponse.statusText}`);
    }

    const statusData = await statusResponse.json();
    log.debug(`Status: ${statusData.status}`);
    isComplete = statusData.status === "SUCCESS";
    if (!isComplete) await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  // Get results in Markdown
  const resultResponse = await fetch(
    `${API_BASE_URL}/api/parsing/job/${jobId}/result/markdown`,
    {
      headers: { Authorization: `Bearer ${LLAMA_CLOUD_API_KEY}` },
    }
  );

  if (!resultResponse.ok) {
    log.error(`Result retrieval failed: ${resultResponse.statusText}`);
    throw new Error(`Result retrieval failed: ${resultResponse.statusText}`);
  }

  log.debug("Result retrieved successfully.");
  const r = await resultResponse.json();

  return {
    text: r.markdown,
  };
};
