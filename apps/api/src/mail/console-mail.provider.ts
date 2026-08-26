import { Injectable, Logger } from '@nestjs/common';
import { MailMessage, MailProvider } from './mail-provider.interface';

/**
 * Development-time default: logs instead of sending. Swap for a
 * ResendMailProvider/BrevoMailProvider in staging/production by changing
 * the binding in MailModule — no call sites change.
 */
@Injectable()
export class ConsoleMailProvider implements MailProvider {
  private readonly logger = new Logger(ConsoleMailProvider.name);

  send(message: MailMessage): Promise<void> {
    this.logger.log(
      `[mail] to=${message.to} subject="${message.subject}"\n${message.text}`,
    );
    return Promise.resolve();
  }
}
