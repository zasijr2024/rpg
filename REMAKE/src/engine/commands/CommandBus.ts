export interface Command<TType extends string = string, TPayload = unknown> {
  type: TType;
  payload: TPayload;
}

export type CommandHandler<TCommand extends Command> = (
  command: TCommand,
) => void;

export class CommandBus<TCommand extends Command> {
  private handlers = new Map<TCommand["type"], CommandHandler<TCommand>[]>();

  register<TType extends TCommand["type"]>(
    type: TType,
    handler: CommandHandler<Extract<TCommand, { type: TType }>>,
  ): () => void {
    const existing = this.handlers.get(type) ?? [];
    existing.push(handler as CommandHandler<TCommand>);
    this.handlers.set(type, existing);

    return () => {
      const current = this.handlers.get(type) ?? [];
      const next = current.filter((candidate) => candidate !== handler);
      if (next.length === 0) {
        this.handlers.delete(type);
      } else {
        this.handlers.set(type, next);
      }
    };
  }

  dispatch(command: TCommand): void {
    const existing = this.handlers.get(command.type);
    if (!existing || existing.length === 0) {
      throw new Error(`No command handler registered for ${command.type}`);
    }
    for (const handler of existing) {
      handler(command);
    }
  }
}
