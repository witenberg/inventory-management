import { ICommand } from '../../../core/cqrs';

/**
 * Payload for seeding customers.
 */
export interface SeedCustomersPayload {
    clearExisting: boolean;
}

/**
 * Command to seed the database with test customers.
 */
export class SeedCustomersCommand implements ICommand {
    constructor(public readonly payload: SeedCustomersPayload) { }
}

