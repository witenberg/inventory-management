import { ICommandHandler } from '../../../../core/cqrs';
import { SeedCustomersCommand } from '../seed-customers.command';
import { CustomerModel, CustomerLocation } from '../../domain/customer.model';
import { EventBus } from '../../../../core/events';
import { CustomersSeededEvent } from '../../domain/events';

/**
 * Result of seeding operation.
 */
export interface SeedCustomersResult {
    count: number;
    message: string;
    customers: Array<{ id: string; name: string; email: string; location: string }>;
}

/**
 * Handler for seeding test customers.
 */
export class SeedCustomersHandler implements ICommandHandler<SeedCustomersCommand, SeedCustomersResult> {
    private eventBus: EventBus;

    constructor() {
        this.eventBus = EventBus.getInstance();
    }

    async execute(command: SeedCustomersCommand): Promise<SeedCustomersResult> {
        const { clearExisting } = command.payload;

        // Clear existing customers if requested
        if (clearExisting) {
            await CustomerModel.deleteMany({});
        }

        // Test customers with different locations
        const testCustomers = [
            {
                name: 'John Smith',
                email: 'john.smith@us.example.com',
                location: CustomerLocation.US,
            },
            {
                name: 'Jane Doe',
                email: 'jane.doe@us.example.com',
                location: CustomerLocation.US,
            },
            {
                name: 'Anna Kowalska',
                email: 'anna.kowalska@pl.example.com',
                location: CustomerLocation.EUROPE,
            },
            {
                name: 'Hans Mueller',
                email: 'hans.mueller@de.example.com',
                location: CustomerLocation.EUROPE,
            },
            {
                name: 'Marie Dubois',
                email: 'marie.dubois@fr.example.com',
                location: CustomerLocation.EUROPE,
            },
            {
                name: 'Li Wei',
                email: 'li.wei@cn.example.com',
                location: CustomerLocation.ASIA,
            },
            {
                name: 'Yuki Tanaka',
                email: 'yuki.tanaka@jp.example.com',
                location: CustomerLocation.ASIA,
            },
            {
                name: 'Raj Patel',
                email: 'raj.patel@in.example.com',
                location: CustomerLocation.ASIA,
            },
        ];

        // Insert customers
        const createdCustomers = await CustomerModel.insertMany(testCustomers);

        const customerList = createdCustomers.map(c => ({
            id: c._id.toString(),
            name: c.name,
            email: c.email,
            location: c.location,
        }));

        // Publish domain event
        const event = new CustomersSeededEvent(
            createdCustomers.length,
            createdCustomers.map(c => c._id.toString())
        );
        await this.eventBus.publish(event);

        return {
            count: createdCustomers.length,
            message: `Successfully seeded ${createdCustomers.length} test customers`,
            customers: customerList,
        };
    }
}

