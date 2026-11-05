import { retiredHandler } from "../_shared/retired.ts";
Deno.serve(retiredHandler("Les achats PayPal sont suspendus. Utilisez le paiement Stripe vérifié."));
