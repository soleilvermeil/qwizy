/**
 * Legal page configuration. Values are read from environment variables.
 * Falls back to placeholder text when unset (for self-hosters who haven't configured yet).
 */
export const legalConfig = {
  publisherName:
    process.env.LEGAL_PUBLISHER_NAME ?? "[Your Name or Organization]",
  publisherAddress:
    process.env.LEGAL_PUBLISHER_ADDRESS ?? "[Your Postal Address]",
  publisherEmail:
    process.env.LEGAL_PUBLISHER_EMAIL ?? "[your.email@example.com]",
  publisherPhone:
    process.env.LEGAL_PUBLISHER_PHONE ?? "[Your Phone Number]",
  publisherDirector:
    process.env.LEGAL_PUBLISHER_DIRECTOR ?? "[Full Name of Director]",
  hostName:
    process.env.LEGAL_HOST_NAME ?? "[Hosting Provider Name]",
  hostAddress:
    process.env.LEGAL_HOST_ADDRESS ?? "[Hosting Provider Postal Address]",
  hostWebsite:
    process.env.LEGAL_HOST_WEBSITE ?? "[https://hosting-provider.example.com]",
  dbHostName:
    process.env.LEGAL_DB_HOST_NAME ?? "",
  dbHostAddress:
    process.env.LEGAL_DB_HOST_ADDRESS ?? "",
  dbHostWebsite:
    process.env.LEGAL_DB_HOST_WEBSITE ?? "",
  lastUpdated:
    process.env.LEGAL_LAST_UPDATED ?? "February 2026",
} as const;
