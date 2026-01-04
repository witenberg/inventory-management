import { IQuery } from '../../../core/cqrs';

/**
 * Query to retrieve a single order by ID.
 */
export class GetOrderByIdQuery implements IQuery {
    constructor(public readonly orderId: string) { }
}

