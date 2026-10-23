import { whatsappLink } from "@/backend/supabase/site-settings";

// One-click ways to reach a client from the admin console: email with the subject filled in,
// a call, and WhatsApp when the number can be turned into one.
export function EmailLink({ email, subject }: { email: string; subject: string }) {
  return <a href={`mailto:${email}?subject=${encodeURIComponent(subject)}`}>{email}</a>;
}

export function PhoneLinks({ phone }: { phone: string }) {
  const whatsapp = whatsappLink(phone);
  return (
    <span className="contact-links">
      <a href={`tel:${phone.replace(/[^\d+]/g, "")}`}>{phone}</a>
      {whatsapp && (
        <>
          {" · "}
          <a href={whatsapp} target="_blank" rel="noopener noreferrer">
            WhatsApp
          </a>
        </>
      )}
    </span>
  );
}
