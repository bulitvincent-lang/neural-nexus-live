import { EmbeddedCheckout, EmbeddedCheckoutProvider } from "@stripe/react-stripe-js";
import { useCallback, useMemo, useState } from "react";

import { getStripe, getStripeEnvironment } from "@/lib/stripe";
import { createCheckoutSession } from "@/utils/payments.functions";

/** Inline payment form. One session per open — never two for one click. */
export function CheckoutOverlay({
  priceId,
  orbId,
  title,
  returnUrl,
  onClose,
}: {
  priceId: string;
  orbId?: string | undefined;
  title: string;
  returnUrl: string;
  onClose: () => void;
}) {
  const [error, setError] = useState<string | null>(null);

  const fetchClientSecret = useCallback(async (): Promise<string> => {
    const result = await createCheckoutSession({
      data: { priceId, orbId, returnUrl, environment: getStripeEnvironment() },
    });
    if ("error" in result) {
      setError(result.error);
      throw new Error(result.error);
    }
    if (!result.clientSecret) throw new Error("No payment session was returned.");
    return result.clientSecret;
  }, [priceId, orbId, returnUrl]);

  const options = useMemo(() => ({ fetchClientSecret }), [fetchClientSecret]);

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-[#080d18]/95 backdrop-blur-sm">
      <div className="flex items-center justify-between px-6 py-5">
        <p className="text-sm tracking-wide text-[#eaf2ff]">{title}</p>
        <button
          type="button"
          onClick={onClose}
          className="rounded-full border border-white/15 px-4 py-2 text-[11px] tracking-wide text-[#b3c6de] transition-colors hover:border-white/40 hover:text-white"
        >
          Cancel
        </button>
      </div>
      <div className="flex-1 overflow-y-auto px-4 pb-8">
        {error ? (
          <p className="mx-auto max-w-md rounded-2xl border border-white/10 bg-white/5 p-6 text-center text-[13px] text-[#ffd5d5]">
            {error}
          </p>
        ) : (
          <div className="mx-auto max-w-2xl rounded-2xl bg-white/95 p-2">
            <EmbeddedCheckoutProvider stripe={getStripe()} options={options}>
              <EmbeddedCheckout />
            </EmbeddedCheckoutProvider>
          </div>
        )}
      </div>
    </div>
  );
}
