import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/public/data";
export default function robots(): MetadataRoute.Robots {
  return { rules: [{ userAgent: "*", allow: "/", disallow: ["/admin", "/student", "/teacher", "/parent", "/accountant", "/api", "/login", "/reset-password", "/forgot-password"] }], sitemap: `${SITE_URL}/sitemap.xml` };
}
