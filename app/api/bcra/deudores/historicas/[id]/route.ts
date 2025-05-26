import { makeBCRARequest } from "@/lib/bcra-api-helper";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  const id = (await params).id;
  return makeBCRARequest(`/centraldedeudores/v1.0/Deudas/Historicas/${id}`);
}
