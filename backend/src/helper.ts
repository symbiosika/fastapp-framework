export const validateAllEnvVariables = () => {
  const requiredEnvVars = [
    "PORT",
    "POSTGRES_HOST",
    "POSTGRES_PORT",
    "POSTGRES_USER",
    "POSTGRES_PASSWORD",
    "POSTGRES_DB",
    "OPENAI_API_KEY",
    "LLAMA_CLOUD_API_KEY",
    "ALLOWED_ORIGINS",
    "AUTH_SECRET",
    "SECRETS_AES_KEY",
    "SECRETS_AES_IV",
    // "JWT_PUBLIC_KEY",
  ];
  const missingEnvVars = requiredEnvVars.filter(
    (envVar) => !process.env[envVar]
  );
  if (missingEnvVars.length > 0) {
    console.error("Missing environment variables:", missingEnvVars);
    process.exit(1);
  } else {
    console.log("All environment variables are set");
  }
};
