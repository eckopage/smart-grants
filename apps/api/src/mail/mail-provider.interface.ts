export interface MailMessage {
  to: string;
  subject: string;
  text: string;
}

export const MAIL_PROVIDER = Symbol('MAIL_PROVIDER');

/**
 * Abstraction over the transactional e-mail service. Swapping the console
 * default for Resend/Brevo (per the infra plan) means implementing this
 * interface, never touching call sites like ApplicationsService.
 */
export interface MailProvider {
  send(message: MailMessage): Promise<void>;
}
