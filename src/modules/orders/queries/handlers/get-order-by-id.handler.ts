import { IQueryHandler } from '../../../../core/cqrs';
import { GetOrderByIdQuery } from '../get-order-by-id.query';
import { OrderModel, OrderData } from '../../domain/order.model';
import { AppError } from '../../../../core/errors/AppError';

/**
 * Handler for retrieving a single order by ID.
 */
export class GetOrderByIdHandler implements IQueryHandler<GetOrderByIdQuery, OrderData> {

    async execute(query: GetOrderByIdQuery): Promise<OrderData> {
        try {
            const order = await OrderModel
                .findById(query.orderId)
                .lean<OrderData>()
                .exec();

            if (!order) {
                throw new AppError('Order not found', 404);
            }

            return order;

        } catch (error) {
            if (error instanceof AppError) {
                throw error;
            }
            if (error instanceof Error) {
                throw new AppError(`Failed to retrieve order: ${error.message}`, 500);
            }
            throw new AppError('Failed to retrieve order', 500);
        }
    }
}

