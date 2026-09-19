import "dotenv/config";

function required(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

export const config = {
  port: Number(process.env.PORT ?? 3001),
  jwtSecret: required("JWT_SECRET"),
  schoolEmailDomain: required("SCHOOL_EMAIL_DOMAIN").toLowerCase(),
  corsOrigin: process.env.CORS_ORIGIN ?? "http://localhost:5173",
};

export function isSchoolEmail(email: string): boolean {
  const domain = email.split("@")[1]?.toLowerCase();
  return domain === config.schoolEmailDomain;
}
