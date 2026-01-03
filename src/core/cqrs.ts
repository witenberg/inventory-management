/**
 * Represents a Command intended to mutate the system state.
 */
export interface ICommand {
    // Marker interface - can be extended if we need metadata like correlationId
}

/**
 * Represents a Query intended to retrieve data without side effects.
 */
export interface IQuery {
    // Marker interface
}

/**
 * Handles the execution of a specific Command.
 * Contains the business logic for state changes.
 */
export interface ICommandHandler<TCommand extends ICommand, TResult = void> {
    execute(command: TCommand): Promise<TResult>;
}

/**
 * Handles the execution of a specific Query.
 */
export interface IQueryHandler<TQuery extends IQuery, TResult> {
    execute(query: TQuery): Promise<TResult>;
}