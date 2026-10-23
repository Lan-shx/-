import { env } from "cloudflare:workers";
import { researchRequest } from "../../../../lib/research-server.mjs";
export async function GET(request: Request) { return researchRequest(request, env); }
export async function POST(request: Request) { return researchRequest(request, env); }
