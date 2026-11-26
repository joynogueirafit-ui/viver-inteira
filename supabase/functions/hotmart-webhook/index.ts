// Recebe os avisos da Hotmart e libera ou bloqueia o acesso ao Viver Inteira.
// Segredos (Supabase → Edge Functions → Secrets): HOTMART_HOTTOK (o "hottok" da Hotmart).
// SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY já existem em toda função.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const LIBERA = ["PURCHASE_APPROVED", "PURCHASE_COMPLETE"];
const BLOQUEIA: Record<string, string> = {
  PURCHASE_REFUNDED: "reembolsada", PURCHASE_CHARGEBACK: "reembolsada",
  PURCHASE_CANCELED: "cancelada", SUBSCRIPTION_CANCELLATION: "cancelada",
};

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("ok");
  const hottok = req.headers.get("x-hotmart-hottok") ?? "";
  if (hottok !== Deno.env.get("HOTMART_HOTTOK")) return new Response("proibido", { status: 401 });

  const corpo = await req.json().catch(() => null);
  const evento: string = corpo?.event ?? "";
  const email: string = (corpo?.data?.buyer?.email ?? "").trim().toLowerCase();
  const transacao: string = corpo?.data?.purchase?.transaction ?? "";
  if (!email) return new Response("sem e-mail", { status: 200 });

  const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  if (LIBERA.includes(evento)) {
    const validade = new Date(Date.now() + 365 * 864e5).toISOString().slice(0, 10);
    await sb.from("compradoras").upsert({ email, status: "ativa", validade, transacao, atualizado: new Date().toISOString() });
  } else if (BLOQUEIA[evento]) {
    await sb.from("compradoras").update({ status: BLOQUEIA[evento], atualizado: new Date().toISOString() }).eq("email", email);
  }
  return new Response("ok");
});
